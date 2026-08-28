/* 🦴 骨架屏组件 — 首屏加载占位动画 */

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
        <div class="skeleton-line skeleton-body" />
        <div class="skeleton-line skeleton-body skeleton-body--short" />
      </SkeletonCard>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <SkeletonCircle size={48} />
        <div style="flex:1;">
          <div class="skeleton-line skeleton-title" style="width:30%;" />
          <div class="skeleton-line skeleton-body" />
        </div>
      </div>
    </>
  );
}
