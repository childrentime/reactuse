import { useEffect } from "react";
import createUpdateEffect from "../createUpdateEffect";

export const useUpdateEffect = createUpdateEffect(useEffect);
