export default function ScheduleLoading() {
    return (
        <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ height: '36px', width: '92px', borderRadius: '10px', background: '#eef5ee' }} />
                <div style={{ height: '36px', width: '220px', borderRadius: '999px', background: '#f4f7f3' }} />
                <div style={{ height: '36px', width: '160px', borderRadius: '10px', background: '#eef5ee' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[0, 1, 2, 3].map((item) => (
                    <div key={item} style={{ height: '16px', width: `${72 + item * 18}px`, borderRadius: '999px', background: '#f3f6f3' }} />
                ))}
            </div>
            <div
                style={{
                    height: '520px',
                    borderRadius: '18px',
                    border: '1px solid #dbe5d8',
                    background: 'linear-gradient(90deg, #ffffff 0 18%, #f8fbf8 18% 100%)',
                }}
            />
        </div>
    )
}
