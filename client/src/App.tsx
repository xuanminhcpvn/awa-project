import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Navigation from './components/Navigation'
import DocumentView from './components/DocumentView';
import DocumentEdit from './components/DocumentEdit';
import DocumentPublic from './components/DocumentPublic';
function App() {
  return (
    <BrowserRouter>
      <Navigation />

      <div className="App">
        <h1>File Drive App</h1>

        <Routes>
          <Route path="/" element={<Home />} />
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
