use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Emitter;
use tauri::Manager;

// ======================== 路径 ========================

fn get_app_dir(app: &tauri::AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    std::fs::create_dir_all(&dir).ok();
    dir
}

fn get_songs_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_dir(app).join("music.txt")
}

fn get_settings_path(app: &tauri::AppHandle) -> PathBuf {
    get_app_dir(app).join("settings.json")
}

// ======================== 设置 ========================

#[derive(Serialize, Deserialize, Default)]
struct Settings {
    #[serde(default)]
    auto_process: bool,
}

fn load_settings(app: &tauri::AppHandle) -> Settings {
    let path = get_settings_path(app);
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_settings(app: &tauri::AppHandle, settings: &Settings) -> Result<(), String> {
    let path = get_settings_path(app);
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, &json).map_err(|e| e.to_string())
}

// ======================== Tauri 命令 ========================

/// 读取曲库文件（music.txt），返回原始文本
#[tauri::command]
fn read_songs_file(app: tauri::AppHandle) -> Result<String, String> {
    let path = get_songs_path(&app);
    if !path.exists() {
        return Ok(String::new());
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// 获取"开机自动处理"开关状态
#[tauri::command]
fn get_auto_process_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    let settings = load_settings(&app);
    Ok(settings.auto_process)
}

/// 设置"开机自动处理"开关
#[tauri::command]
fn set_auto_process_enabled(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let mut settings = load_settings(&app);
    settings.auto_process = enabled;
    save_settings(&app, &settings)
}

#[tauri::command]
fn log_error(message: String) {
    tracing::error!(target: "frontend", "{message}");
}

// ======================== 入口 ========================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            // 开机自启动 + 自动处理 → 发射事件通知前端
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(800));
                let settings = load_settings(&handle);
                if settings.auto_process {
                    let _ = handle.emit("auto-process", ());
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            read_songs_file,
            get_auto_process_enabled,
            set_auto_process_enabled,
            log_error,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ======================== 单元测试 ========================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings_default() {
        let s = Settings::default();
        assert!(!s.auto_process);
    }

    #[test]
    fn test_settings_json_roundtrip() {
        let s = Settings { auto_process: true };
        let json = serde_json::to_string_pretty(&s).unwrap();
        let deserialized: Settings = serde_json::from_str(&json).unwrap();
        assert!(deserialized.auto_process);
    }

    #[test]
    fn test_settings_missing_field_defaults_to_false() {
        let json = r#"{}"#;
        let s: Settings = serde_json::from_str(json).unwrap();
        assert!(!s.auto_process);
    }

    #[test]
    fn test_songs_file_write_read() {
        let dir = std::env::temp_dir().join("song-manager-unit-test");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("music.txt");

        // Write
        let content = "歌名\n\nSong A\nSong B\n共2首\n";
        std::fs::write(&path, content).unwrap();

        // Read
        let read_back = std::fs::read_to_string(&path).unwrap();
        assert_eq!(content, read_back);

        // Clean up
        std::fs::remove_dir_all(&dir).ok();
    }
}
