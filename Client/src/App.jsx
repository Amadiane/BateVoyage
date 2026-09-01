import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import ListePelerins from "./pages/pelerins/ListePelerins";
import FormulairePelerin from "./pages/pelerins/FormulairePelerin";
import DetailPelerin from "./pages/pelerins/DetailPelerin";
import PageModuleVoyage from "./pages/moduleVoyage/PageModuleVoyage";
import PagePelerinsModule from "./pages/moduleVoyage/PagePelerinsModule";
import PageDocuments from "./pages/documents/PageDocuments";
import ListeUtilisateurs from "./pages/utilisateurs/ListeUtilisateurs";
import FormulaireUtilisateur from "./pages/utilisateurs/FormulaireUtilisateur";
import PageJournalActivite from "./pages/activite/PageJournalActivite";
import ListePaiements from "./pages/paiements/ListePaiements";
import ListeProgrammes from "./pages/programmes/ListeProgrammes";
import DetailProgramme from "./pages/programmes/DetailProgramme";
import PageGroupesVols from "./pages/groupes/PageGroupesVols";
import DetailGroupe from "./pages/groupes/DetailGroupe";
import PageHebergement from "./pages/hebergement/PageHebergement";
import DetailHotel from "./pages/hebergement/DetailHotel";
import DetailChambre from "./pages/hebergement/DetailChambre";
import ListeReclamations from "./pages/reclamations/ListeReclamations";
import PageComptabilite from "./pages/comptabilite/PageComptabilite";
import ListePersonnel from "./pages/personnel/ListePersonnel";
import FormulairePersonnel from "./pages/personnel/FormulairePersonnel";
import PageModelesDocuments from "./pages/modeles-documents/PageModelesDocuments";
import PageModulesVisibles from "./pages/parametres/PageModulesVisibles";
import PageForfaitsModule from "./pages/moduleVoyage/PageForfaitsModule";
import "./globals.css";

const ROLES_FINANCIERS = ["fondateur", "admin_general", "comptable", "secretaire"];
const ROLES_ADMIN = ["fondateur", "admin_general"];
const ROLES_RECLAMATIONS = ["fondateur", "admin_general", "affaires_sociales"];

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

          {/* Pèlerins — routes techniques partagées (formulaire, détail) */}
          <Route path="/pelerins" element={<ListePelerins />} />
          <Route path="/pelerins/nouveau" element={<FormulairePelerin />} />
          <Route path="/pelerins/:id" element={<DetailPelerin />} />
          <Route path="/pelerins/:id/modifier" element={<FormulairePelerin />} />

          {/* Module Hajj */}
          <Route path="/hajj" element={<PageModuleVoyage typeVoyage="pelerinage" basePath="/hajj" titreCle="menu_hajj" />} />
          <Route path="/hajj/pelerins" element={<PagePelerinsModule typeVoyage="pelerinage" basePath="/hajj" />} />
          <Route path="/hajj/pelerins/liste" element={<ListePelerins typeVoyageFixe="pelerinage" titreCle="menu_hajj" retourPath="/hajj/pelerins" />} />
          <Route path="/hajj/forfaits" element={<PageForfaitsModule typeVoyage="pelerinage" basePath="/hajj" />} />
          <Route path="/oumra/forfaits" element={<PageForfaitsModule typeVoyage="oumra" basePath="/oumra" />} />

          {/* Module Oumra */}
          <Route path="/oumra" element={<PageModuleVoyage typeVoyage="oumra" basePath="/oumra" titreCle="menu_oumra" />} />
          <Route path="/oumra/pelerins" element={<PagePelerinsModule typeVoyage="oumra" basePath="/oumra" />} />
          <Route path="/oumra/pelerins/liste" element={<ListePelerins typeVoyageFixe="oumra" titreCle="menu_oumra" retourPath="/oumra/pelerins" />} />

          {/* Documents (conformité dossiers) */}
          <Route path="/documents" element={<PageDocuments />} />

          {/* Paiements */}
          <Route
            path="/paiements"
            element={
              <ProtectedRoute rolesAutorises={ROLES_FINANCIERS}>
                <ListePaiements />
              </ProtectedRoute>
            }
          />

          {/* Comptabilité */}
          <Route
            path="/comptabilite"
            element={
              <ProtectedRoute rolesAutorises={ROLES_FINANCIERS}>
                <PageComptabilite />
              </ProtectedRoute>
            }
          />

          {/* Programmes / Activités */}
          <Route
            path="/programmes"
            element={
              <ProtectedRoute rolesAutorises={ROLES_FINANCIERS}>
                <ListeProgrammes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/programmes/:id"
            element={
              <ProtectedRoute rolesAutorises={ROLES_FINANCIERS}>
                <DetailProgramme />
              </ProtectedRoute>
            }
          />

          {/* Groupes & Vols */}
          <Route path="/groupes" element={<PageGroupesVols />} />
          <Route path="/groupes/:id" element={<DetailGroupe />} />

          {/* Hébergement */}
          <Route path="/hebergement" element={<PageHebergement />} />
          <Route path="/hebergement/:id" element={<DetailHotel />} />
          <Route path="/hebergement/chambre/:id" element={<DetailChambre />} />

          {/* Réclamations */}
          <Route
            path="/reclamations"
            element={
              <ProtectedRoute rolesAutorises={ROLES_RECLAMATIONS}>
                <ListeReclamations />
              </ProtectedRoute>
            }
          />

          {/* Personnel (Guides/Encadreurs/Docteurs/Mounazim) */}
          <Route
            path="/personnel"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <ListePersonnel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personnel/nouveau"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <FormulairePersonnel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personnel/:id"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <FormulairePersonnel />
              </ProtectedRoute>
            }
          />

          {/* Modèles de documents générés */}
          <Route
            path="/modeles-documents"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <PageModelesDocuments />
              </ProtectedRoute>
            }
          />

          {/* Utilisateurs */}
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

          {/* Journal d'activité */}
          <Route
            path="/journal-activite"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <PageJournalActivite />
              </ProtectedRoute>
            }
          />

          {/* Paramètres — modules visibles (toujours accessible Fondateur/Admin) */}
          <Route
            path="/parametres/modules"
            element={
              <ProtectedRoute rolesAutorises={ROLES_ADMIN}>
                <PageModulesVisibles />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;