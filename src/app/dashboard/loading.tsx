export default function DashboardLoading() {
    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ height: '36px', width: '180px', borderRadius: '12px', background: '#e8efe7' }} />
            <div style={{ height: '20px', width: '220px', borderRadius: '999px', background: '#f2f6f2' }} />
            <div style={{ display: 'grid', gap: '12px' }}>
                {[0, 1, 2].map((item) => (
                    <div
                        key={item}
                        style={{
                            borderRadius: '16px',
                            border: '1px solid #e2e8e0',
                            background: '#ffffff',
                            padding: '20px',
                            display: 'grid',
                            gap: '10px',
                            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                        }}
                    >
                        <div style={{ height: '22px', width: `${55 + item * 10}%`, borderRadius: '10px', background: '#edf4ec' }} />
                        <div style={{ height: '14px', width: '100%', borderRadius: '999px', background: '#f4f7f3' }} />
                        <div style={{ height: '14px', width: '84%', borderRadius: '999px', background: '#f4f7f3' }} />
                        <div style={{ height: '38px', width: '100%', borderRadius: '12px', background: '#eef6ee' }} />
                    </div>
                ))}
            </div>
        </div>
    )
}
