export const runtime = 'edge';

export default function NotFound() {
  return (
    <div style={{padding: 24, fontFamily: 'system-ui, sans-serif'}}>
      <h1>页面未找到</h1>
      <p>抱歉，所请求的页面不存在。</p>
    </div>
  );
}
