/* eslint-disable @typescript-eslint/no-var-requires */
import clsx from "clsx";
import Heading from "@theme/Heading";
import Translate, { translate } from "@docusaurus/Translate";
import styles from "./styles.module.css";

interface FeatureItem {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
}

const FeatureList: FeatureItem[] = [
  {
    title: translate({
      message: "Import on demand",
    }),
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <Translate>
        Each component can be introduced separately and has good tree-shaking optimization
      </Translate>
    ),
  },
  {
    title: translate({
      message: "Server-side rendering",
    }),
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <Translate>
        Friendly server-side rendering support
      </Translate>
    ),
  },
  {
    title: translate({
      message: "Friendly typescript support",
    }),
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: (
      <Translate>
        Built with Typescript, providing a nice component type system
      </Translate>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
