import React from "react";
import ReactDOM from "react-dom";
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import "./index.css"
import history from "../src/history"
import Home from "./Pages/Home.js";

(async ()  => {

  ReactDOM.render(
    <Router history={history}>
        <Routes>
          <Route exact path="/" element={<Home/>} />
        </Routes>
      </Router>,
    document.getElementById('root')
    );
})();
    