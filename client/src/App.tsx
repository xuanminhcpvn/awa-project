import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navigation from './components/Navigation'
import DocumentView from './pages/DocumentView';
import DocumentEdit from './pages/DocumentEdit';
import DocumentPublic from './pages/DocumentPublic';
import DocumentTrash from './pages/DocumentTrash';
function App() { 
  return (
    <BrowserRouter>
      <Navigation />

      <div className="App">
        <h1>File Drive App</h1>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trash" element={<DocumentTrash />} />
          <Route path="/document/edit/:driveFileId" element={<DocumentEdit />} />
          <Route path="/document/view/:driveFileId" element={<DocumentView />} />
          <Route path="/document/public/:driveFileId" element={<DocumentPublic />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
export default App
