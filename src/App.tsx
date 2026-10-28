import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './screens/Home';

// Code-split các màn hình bằng React.lazy
const Practice = React.lazy(() =>
  import('./screens/Practice').then((m) => ({ default: m.Practice }))
);
const Result = React.lazy(() =>
  import('./screens/Result').then((m) => ({ default: m.Result }))
);
const ExamIntro = React.lazy(() =>
  import('./screens/ExamIntro').then((m) => ({ default: m.ExamIntro }))
);
const ExamTaking = React.lazy(() =>
  import('./screens/ExamTaking').then((m) => ({ default: m.ExamTaking }))
);
const ExamResult = React.lazy(() =>
  import('./screens/ExamResult').then((m) => ({ default: m.ExamResult }))
);

// Route /review chỉ bật khi đang chạy môi trường phát triển (DEV)
const Review = import.meta.env.DEV
  ? React.lazy(() =>
      import('./screens/Review').then((m) => ({ default: m.Review }))
    )
  : null;

const LoadingFallback: React.FC = () => (
  <div className="quiz-container" style={{ textAlign: 'center', padding: '48px 20px' }}>
    <div className="question-card" style={{ maxWidth: 360, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--dp-typography-display-face)', fontSize: '1.4rem', margin: 0 }}>
        ✏ Đang nạp trang...
      </p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/result" element={<Result />} />

        {/* Chế độ thi thử */}
        <Route path="/exam/intro" element={<ExamIntro />} />
        <Route path="/exam/taking" element={<ExamTaking />} />
        <Route path="/exam/result" element={<ExamResult />} />

        {/* Route /review chỉ có ở dev mode để kiểm tra đối chiếu công thức */}
        {import.meta.env.DEV && Review && (
          <Route path="/review" element={<Review />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
