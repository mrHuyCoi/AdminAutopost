import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  colorType: 'primary' | 'success' | 'info' | 'warning' | 'danger';
  icon?: string;
  iconComponent?: React.ReactNode;
  gradient?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  colorType, 
  icon, 
  iconComponent,
  gradient = false 
}) => {
  
  // COLOR MAPPING HOÀN CHỈNH
  const colorConfig = {
    primary: {
      text: 'var(--bs-primary, #4F46E5)',
      bg: gradient ? 'linear-gradient(135deg, #4F46E5, #7C73E6)' : '#4F46E5',
      class: 'bg-primary text-white'
    },
    success: {
      text: 'var(--bs-success, #10B981)',
      bg: gradient ? 'linear-gradient(135deg, #10B981, #34D399)' : '#10B981',
      class: 'bg-success text-white'
    },
    info: {
      text: 'var(--bs-info, #3B82F6)',
      bg: gradient ? 'linear-gradient(135deg, #3B82F6, #60A5FA)' : '#3B82F6',
      class: 'bg-info text-white'
    },
    warning: {
      text: 'var(--bs-warning, #F59E0B)',
      bg: gradient ? 'linear-gradient(135deg, #F59E0B, #FBBF24)' : '#F59E0B',
      class: 'bg-warning text-dark'
    },
    danger: {
      text: 'var(--bs-danger, #EF4444)',
      bg: gradient ? 'linear-gradient(135deg, #EF4444, #F87171)' : '#EF4444',
      class: 'bg-danger text-white'
    }
  };

  const config = colorConfig[colorType];

  // VERSION 1: CÓ ICON (FontAwesome)
  if (icon) {
    return (
      <div className="stat-card d-flex align-items-center gap-3 p-3 rounded shadow-sm bg-white border-0">
        <div 
          className="stat-icon d-flex align-items-center justify-content-center rounded-circle"
          style={{ 
            background: config.bg,
            width: '50px',
            height: '50px',
            flexShrink: 0 
          }}
        >
          <i className={icon} style={{ fontSize: '1.5rem', color: '#fff' }}></i>
        </div>
        <div className="stat-info">
          <h3 className="mb-0 fw-bold" style={{ color: config.text }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          <p className="mb-0 text-muted small">{title}</p>
        </div>
      </div>
    );
  }

  // VERSION 2: CÓ ICON COMPONENT (React Component)
  if (iconComponent) {
    return (
      <div className={`card ${config.class} shadow-sm border-0`}>
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-8">
              <h6 className="card-title mb-1 opacity-90">{title}</h6>
              <h3 className="mb-0 fw-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </h3>
            </div>
            <div className="col-4 text-end">
              {iconComponent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VERSION 3: ĐƠN GIẢN (Không icon)
  return (
    <div className="stat-card p-3 rounded shadow-sm bg-white border-0">
      <div className="card-body p-0">
        <h3 
          className="stat-number mb-0 fw-bold" 
          style={{ color: config.text }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p className="stat-text mb-0 text-muted small">{title}</p>
      </div>
    </div>
  );
};



export default StatCard;