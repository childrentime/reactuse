import { useLayoutEffect } from "react";
import createOnceEffect from "../createOnceEffect";

export default createOnceEffect(useLayoutEffect);
