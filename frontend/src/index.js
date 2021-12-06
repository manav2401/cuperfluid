import React, {lazy, Suspense} from "react";
import ReactDOM from "react-dom";
import {BrowserRouter, Route, Switch, Redirect} from "react-router-dom";
import "assets/plugins/nucleo/css/nucleo.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "assets/scss/argon-dashboard-react.scss";
const DashboardLayout = lazy(() => import("layouts/Dashboard.js"));

(async () => {
	ReactDOM.render(
		<BrowserRouter>
			<Suspense fallback={<h1> Loading</h1>}>
				<Switch>
					<Route
						path="/"
						render={(props) => <DashboardLayout {...props} />}
					/>
					<Redirect from="/" to="/asset" />
				</Switch>
			</Suspense>
		</BrowserRouter>,
		document.getElementById("root")
	);
})();
