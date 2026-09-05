import type { JSX } from "react";

const NotFound = (): JSX.Element => {
	return (
		<div className="mt-20 px-[10vw] max-sm:px-8 [&_h1]:text-[2rem] [&_h2]:text-base">
			<h1>404: Page Not Found</h1>
			<h2>Please check your URL, or select something from the nav bar</h2>
		</div>
	);
};

export default NotFound;
