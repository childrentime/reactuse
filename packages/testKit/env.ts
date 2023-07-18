export const jestFakeTimersAreEnabled = () => {
  if (typeof jest !== "undefined" && jest !== null) {
    return (
      Object.prototype.hasOwnProperty.call(setTimeout, "clock")
    );
  }
  return false;
};
