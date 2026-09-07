import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { AdminEvents } from "./pages/admin/Events";
import { AdminCodeDisplay } from "./pages/admin/CodeDisplay";
import { AdminCheckins } from "./pages/admin/Checkins";
import { AdminFlagged } from "./pages/admin/Flagged";
import { RequireAuth } from "./components/RequireAuth";

export function App() {
  return (
    <BrowserRouter>
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
          path="/admin/events"
          element={
            <RequireAuth role="STAFF">
              <AdminEvents />
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
