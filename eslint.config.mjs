import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/** eslint-config-next 16 ส่ง flat config มาให้ตรงๆ ไม่ต้องใช้ FlatCompat แล้ว */
const config = [
    { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
    ...coreWebVitals,
    ...typescript,
]

export default config
