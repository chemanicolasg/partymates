# PartyMates 🎲

Mundos de aventuras donde las matemáticas son la mecánica del juego, para niños y niñas de 5 a 12 años.
En **catalán, castellano e inglés**. Web app instalable (PWA) pensada para móvil, tableta y ordenador.

> El niño no «hace ejercicios»: construye puentes, corre en un tablero de dados, rompe escudos y reparte
> tesoros. Para conseguirlo tiene que contar, componer números, calcular y memorizar.

## Qué incluye

| Mundo | Mecánica | Matemáticas | Método |
| --- | --- | --- | --- |
| ⛏️ **Valle de Bloques** | Elegir las piezas justas para que el puente cruce el río | Sentido numérico, valor posicional, decimales, fracciones, porcentajes, «lo que falta» | Montessori (material dorado, error visible) |
| 🎲 **Isla de la Fiesta** | Tirar dados y tocar la casilla donde aterrizas, contra tres rivales | Suma y resta en la recta numérica, productos, jerarquía de operaciones, números negativos | CPA: tablero completo → plataformas → fórmula |
| ⚡ **Arena Tormenta** | Fusionar dos cartas para igualar el escudo del robot, contra el reloj | Cálculo mental, tablas, divisiones, complementos a 100 | Fluidez + repaso espaciado |
| 💎 **Bahía del Tesoro** | Repartir el botín de forma justa | División, restos, fracción de una cantidad, porcentajes, proporciones | Montessori (repartir una a una) → modelo de barras (Singapur) |
| ⚡ **Gimnasio Rayo** | Ficha diaria de 12 cálculos con tiempo objetivo | 26 fichas encadenadas, de «+1» a complementos a 100 | Kumon (pasos pequeños, precisión + tiempo para avanzar) |

Además:

- **4 itinerarios por edad** (5–6, 7–8, 9–10, 11–12): cada mundo tiene 8 niveles por itinerario → 128 niveles.
- **Repaso espaciado (Leitner)**: cada suma o tabla fallada vuelve a aparecer; al acertarla se espacia 1, 2, 4, 7 y 15 días.
- **Pistas que retroceden una etapa** (concreto → pictórico → abstracto) en lugar de dar la respuesta.
- **Estrellas por acertar a la primera**, monedas, niveles de jugador y tienda de personajes/mascotas (sin dinero real).
- **Clases y equipos**: código de 6 letras, ranking semanal e histórico, equipos dentro de la clase.
- **Zona de adultos**: informe por mundo, hechos numéricos memorizados y los que más cuestan, cambio de itinerario.
- **Privacidad**: sin cuentas, sin anuncios, sin compras. Solo un apodo y un avatar.

## Ponerlo en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 143 pruebas del motor pedagógico
npm run build    # genera dist/ (PWA con funcionamiento sin conexión)
```

## Clases en línea

Sin configurar nada, las clases funcionan en **modo tableta**: se guardan en el dispositivo y las comparten
los jugadores de ese dispositivo (útil para tabletas de aula compartidas o hermanos).

Con las dos variables de `.env.example` definidas, las clases se comparten entre dispositivos a través de
[Supabase](https://supabase.com). El proyecto **Partymaths** ya tiene aplicado el esquema de
`supabase/migrations/`; para usar otro proyecto, ejecuta esas migraciones en él y cambia las variables.

Las tablas están cerradas (RLS sin políticas y sin permisos para la API); la app solo puede llamar a las
funciones `pm_*`, que únicamente exponen apodo, avatar y puntuaciones. Cada jugador se identifica con un
secreto que nunca sale de su dispositivo.

## Publicación

`netlify.toml` define la compilación (`npm run build` → `dist/`). El sitio de Netlify **partymaths** ya tiene
las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ambas públicas por diseño: viajan al navegador).

## Estructura

```
src/core/         motor sin interfaz: currículo, generadores de problemas, repaso espaciado, puntuación, guardado
src/core/backend/ clases y equipos (local o Supabase)
src/games/        los cuatro minijuegos y el Gimnasio Rayo
src/screens/      mapa, mundos, tienda, clase, zona de adultos
src/i18n/         textos en ca / es / en
tests/            pruebas del motor (todos los niveles generan problemas resolubles)
supabase/         esquema SQL de las clases en línea
```

Para añadir o ajustar niveles basta con editar `src/core/curriculum.ts`: cada nivel es una línea de configuración.

## Siguiente paso: apps de móvil y iPad

La web ya es instalable desde el navegador («Añadir a pantalla de inicio») y funciona sin conexión.
Para publicarla en App Store y Google Play se envuelve con [Capacitor](https://capacitorjs.com) sin reescribir nada:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init PartyMates com.partymates.app --web-dir dist
npm run build && npx cap add ios && npx cap add android && npx cap sync
```

(Compilar para iOS requiere un Mac con Xcode y una cuenta de desarrollador de Apple.)
