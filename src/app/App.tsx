import { BrowserRouter, Routes, Route } from "react-router";
import { UploadPage } from "../features/upload/UploadPage";
import { ResultsPage } from "../features/results/ResultsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}