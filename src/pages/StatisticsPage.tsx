// src/pages/StatisticsPage.tsx
import React from 'react';
import StatCard from '../components/StatCard'; // Component StatCard chúng ta đã tạo

// 1. Import các component Biểu đồ và Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// 2. Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StatisticsPage: React.FC = () => {

  // === 3. DỮ LIỆU GIẢ CHO BIỂU ĐỒ ===

  // Dữ liệu cho biểu đồ Doanh thu (Line chart)
  const revenueData = {
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
    datasets: [
      {
        label: 'Doanh thu (VNĐ)',
        data: [12000000, 19000000, 15000000, 25000000, 22000000, 30000000],
        borderColor: '#6658dd',
        backgroundColor: 'rgba(102, 88, 221, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Người dùng mới (Bar chart)
  const userData = {
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
    datasets: [
      {
        label: 'Người dùng mới',
        data: [12, 19, 15, 25, 22, 30],
        backgroundColor: 'rgba(25, 135, 84, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  // Dữ liệu cho biểu đồ Gói phổ biến (Doughnut chart)
  const packageData = {
    labels: ['Gói Cơ bản', 'Gói Tiết kiệm', 'Gói Chuyên nghiệp'],
    datasets: [
      {
        label: 'Lượt đăng ký',
        data: [120, 190, 80],
        backgroundColor: [
          '#6658dd',
          '#198754',
          '#ffc107',
        ],
        borderColor: [
          '#FFFFFF',
          '#FFFFFF',
          '#FFFFFF',
        ],
        borderWidth: 2,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
  };


  // === 4. JSX RETURN ===
  return (
    <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
      
      {/* Stats Cards Row */}
      <div className="row g-3 g-lg-4">
        <StatCard title="Tổng doanh thu" value="85.4M ₫" colorType="primary" />
        <StatCard title="Tổng người dùng" value="156" colorType="success" />
        <StatCard title="Tổng đăng ký" value="342" colorType="info" />
        <StatCard title="Gói hoạt động" value="320" colorType="warning" />
      </div>

      {/* Hàng chứa biểu đồ Doanh thu và Gói */}
      <div className="row g-3 g-lg-4">
        {/* Biểu đồ Doanh thu (Line) */}
        <div className="col-lg-8 col-12">
          <div className="table-card">
            <div className="card-header">
              <h3>Báo cáo doanh thu (6 tháng)</h3>
            </div>
            <div className="card-body">
              <Line options={chartOptions} data={revenueData} />
            </div>
          </div>
        </div>

        {/* Biểu đồ Gói phổ biến (Doughnut) */}
        <div className="col-lg-4 col-12">
          <div className="table-card">
            <div className="card-header">
              <h3>Gói phổ biến</h3>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center" style={{maxHeight: '400px'}}>
              <Doughnut data={packageData} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Biểu đồ Người dùng mới (Bar) */}
      <div className="row g-3 g-lg-4">
        <div className="col-12">
          <div className="table-card">
            <div className="card-header">
              <h3>Người dùng mới (6 tháng)</h3>
            </div>
            <div className="card-body">
              <Bar options={chartOptions} data={userData} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StatisticsPage;