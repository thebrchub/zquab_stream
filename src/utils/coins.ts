// "zCoin" for exactly one, "zCoins" otherwise.
export const coinUnit = (n: number) => (n === 1 ? 'zCoin' : 'zCoins');

// A coin amount with its unit, e.g. "1 zCoin", "1,500 zCoins".
export const formatCoins = (n: number) => `${n.toLocaleString()} ${coinUnit(n)}`;
