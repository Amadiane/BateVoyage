import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import ListePelerins from "./pages/pelerins/ListePelerins";
import FormulairePelerin from "./pages/pelerins/FormulairePelerin";
import DetailPelerin from "./pages/pelerins/DetailPelerin";
import PageDocuments from "./pages/documents/PageDocuments";
import ListeUtilisateurs from "./pages/utilisateurs/ListeUtilisateurs";
import FormulaireUtilisateur from "./pages/utilisateurs/FormulaireUtilisateur";
import PageJournalActivite from "./pages/activite/PageJournalActivite";
import ListePaiements from "./pages/paiements/ListePaiements";
import ListeProgrammes from "./pages/programmes/ListeProgrammes";
import PageGroupesVols from "./pages/groupes/PageGroupesVols";
import DetailGroupe from "./pages/groupes/DetailGroupe";
import PageHebergement from "./pages/hebergement/PageHebergement";
import DetailHotel from "./pages/hebergement/DetailHotel";
import DetailChambre from "./pages/hebergement/DetailChambre";
import "./globals.css";

const ROLES_FINANCIERS = ["fondateur", "admin_general", "comptable", "secretaire"];
const ROLES_ADMIN = ["fondateur", "admin_general"];

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/pelerins" element={<ListePelerins />} />
          <Route path="/pelerins/nouveau" element={<FormulairePelerin />} />
          <Route path="/pelerins/:id" element={<DetailPelerin />} />
          <Route path="/pelerins/:id/modifier" element={<FormulairePelerin />} />
          <Route path="/groupes" element={<PageGroupesVols />} />
          <Route path="/groupes/:id" element={<DetailGroupe />} />
          <Route path="/hebergement" element={<PageHebergement />} />
          <Route path="/hebergement/:id" element={<DetailHotel />} />
          <Route path="/hebergement/chambre/:id" element={<DetailChambre />} />

          <Route path="/documents" element={<PageDocuments />} />

          <Route
            path="/paiements"
            element={
              <ProtectedRoute rolesAutorises={ROLES_FINANCIERS}>
                <ListePaiements />
              </ProtectedRoute>
            }
          />

          <Route
            path="/utilisateurs"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <ListeUtilisateurs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/utilisateurs/nouveau"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <FormulaireUtilisateur />
              </ProtectedRoute>
            }
          />
          <Route
            path="/utilisateurs/:id/modifier"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <FormulaireUtilisateur />
              </ProtectedRoute>
            }
          />

          <Route
            path="/journal-activite"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <PageJournalActivite />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/programmes"
          element={
            <ProtectedRoute rolesAutorises={["fondateur", "admin_general", "comptable"]}>
              <ListeProgrammes />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;