import { useEffect } from "react";
import createOnceEffect from "../createOnceEffect";

export const useOnceEffect = createOnceEffect(useEffect);
