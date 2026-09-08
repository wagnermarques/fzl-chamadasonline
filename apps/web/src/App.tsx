import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { EnrollDevice } from "./pages/EnrollDevice";
import { AdminEvents } from "./pages/admin/Events";
import { AdminCodeDisplay } from "./pages/admin/CodeDisplay";
import { AdminCheckins } from "./pages/admin/Checkins";
import { AdminFlagged } from "./pages/admin/Flagged";
import { AdminEnroll } from "./pages/admin/Enroll";
import { RequireAuth } from "./components/RequireAuth";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth role="STUDENT">
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/vincular"
          element={
            <RequireAuth role="STUDENT">
              <EnrollDevice />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/events"
          element={
            <RequireAuth role="STAFF">
              <AdminEvents />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/enroll"
          element={
            <RequireAuth role="STAFF">
              <AdminEnroll />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/events/:eventId/periods/:periodId/display"
          element={
            <RequireAuth role="STAFF">
              <AdminCodeDisplay />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/events/:eventId/periods/:periodId/checkins"
          element={
            <RequireAuth role="STAFF">
              <AdminCheckins />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/events/:eventId/flagged"
          element={
            <RequireAuth role="STAFF">
              <AdminFlagged />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
