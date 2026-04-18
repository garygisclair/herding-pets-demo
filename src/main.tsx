import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./index.css";
import Layout from "./Layout";
import MyPets from "./pages/MyPets";
import PetDetail from "./pages/PetDetail";
import ActivityLog from "./pages/ActivityLog";
import Reports from "./pages/Reports";
import { StoreProvider } from "./store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<MyPets />} />
            <Route path="/pets/:id" element={<PetDetail />} />
            <Route path="/activity" element={<ActivityLog />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
);
