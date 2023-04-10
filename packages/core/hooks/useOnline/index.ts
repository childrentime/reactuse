import useNetwork from "../useNetwork";

export default function useOnline(): boolean | undefined {
  const { online } = useNetwork();
  return online;
}
