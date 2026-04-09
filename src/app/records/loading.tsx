export default function RecordsLoading() {
    return (
        <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ height: '32px', width: '180px', borderRadius: '12px', background: '#e8efe7' }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[0, 1, 2].map((item) => (
                        <div key={item} style={{ height: '34px', width: '96px', borderRadius: '10px', background: '#eef4ed' }} />
                    ))}
                </div>
            </div>
            <div style={{ height: '52px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e5ebe3' }} />
            <div style={{ height: '120px', borderRadius: '16px', background: 'linear-gradient(135deg, #eef6ee, #f8fbf8)' }} />
            <div style={{ height: '360px', borderRadius: '18px', background: '#ffffff', border: '1px solid #e5ebe3' }} />
        </div>
    )
}
