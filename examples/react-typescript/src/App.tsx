import React from "react";
import logo from "./assets/logo.svg";
import "./App.css";
import { usePulse } from "pulse-framework";
import core from "./core";

interface Global {
	[key: string]: any; // Add index signature
}
(globalThis as Global).core = core;

const App = () => {
	// usePulse to subscribe to Pulse state
	const [collection, current] = usePulse([
		core.accounts.collection.groups.default,
		core.accounts.collection.selectors.CURRENT,
	]);

	return (
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo" />
				<a
					className="App-link"
					href="https://reactjs.org"
					target="_blank"
					rel="noopener noreferrer"
				>
					Pulse X React
				</a>
				<p>{JSON.stringify(collection)}</p>
				{/* <p className="small-text">{JSON.stringify(duration)}</p> */}
			</header>
		</div>
	);
};

export default App;
