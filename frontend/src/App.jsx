import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Predict from "./pages/Predict";
import PatientIntake from "./pages/PatientIntake";
import Hospitals from "./pages/Hospitals";
import BatchPredict from "./pages/BatchPredict";
import DoctorAuth from "./pages/DoctorAuth";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorNewRecord from "./pages/DoctorNewRecord";
import Analytics from "./pages/Analytics";

export default function App() {
  const { t } = useTranslation();
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/intake" element={<PatientIntake />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/batch" element={<BatchPredict />} />
          <Route path="/doctor" element={<DoctorAuth />} />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/new"
            element={
              <ProtectedRoute>
                <DoctorNewRecord />
              </ProtectedRoute>
            }
          />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </main>
      <footer className="app-footer">{t("disclaimer.model")}</footer>
    </div>
  );
}
