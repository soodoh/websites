import rawFixture from "@tests/fixtures/contentful.json";
import { parseContentfulFixture } from "@/lib/contentful-fixture-types";

export const contentfulFixture = parseContentfulFixture(
	JSON.parse(JSON.stringify(rawFixture)),
);
