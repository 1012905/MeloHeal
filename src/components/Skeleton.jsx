/* 🦴 骨架屏组件 — 首屏加载占位动画（纯展示） */

export function SkeletonCard(props) {
  return (
    <div class="section-card skeleton-card" style={props.style}>
      {props.children || (
        <>
          <div class="skeleton-line skeleton-title" />
          <div class="skeleton-line skeleton-body" />
          <div class="skeleton-line skeleton-body skeleton-body--short" />
        </>
      )}
    </div>
  );
}

export function SkeletonCircle(props) {
  return (
    <div class="skeleton-circle" style={props.size ? { width: `${props.size}px`, height: `${props.size}px` } : undefined} />
  );
}

/* 歌曲行占位：与真实条目同构（封面块 + 标题 + 元信息） */
export function SkeletonSongRow() {
  return (
    <div class="song-row skeleton-row" aria-hidden="true">
      <span class="song-row-check"><span class="skeleton-circle" style="width:18px;height:18px;" /></span>
      <span class="skeleton-circle" style="width:46px;height:46px;border-radius:12px;" />
      <span class="song-row-main">
        <span class="skeleton-line skeleton-title" style="width:52%;margin-bottom:6px;" />
        <span class="skeleton-line skeleton-body" style="width:34%;margin-bottom:0;" />
      </span>
    </div>
  );
}

/* Default: full-page loading with multiple skeleton cards */
export default function SkeletonPage() {
  return (
    <>
      <SkeletonCard>
        <div class="skeleton-line skeleton-title" style="width:40%;" />
        <div class="skeleton-line skeleton-body" />
        <div class="skeleton-line skeleton-body" />
        <div class="skeleton-line skeleton-body skeleton-body--short" />
      </SkeletonCard>
      <SkeletonCard>
        <div class="skeleton-line skeleton-title" style="width:55%;" />
        <SkeletonSongRow />
        <SkeletonSongRow />
        <SkeletonSongRow />
      </SkeletonCard>
    </>
  );
}
