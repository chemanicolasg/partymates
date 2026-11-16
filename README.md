# Matty 🎲

Un viaje de aventuras donde las matemáticas son la mecánica del juego, para niños y niñas de 5 a 12 años.
En **catalán, castellano e inglés**. Web app instalable (PWA) pensada para móvil, tableta y ordenador.

> El niño no «hace ejercicios»: construye puentes, cruza ríos, rompe escudos y reparte tesoros.
> Para conseguirlo tiene que contar, ordenar, componer números, calcular y memorizar.

## Matty

La mascota: un explorador turquesa con bufanda amarilla que guía el viaje, da pistas desde la barra de cada
juego, anima cuando algo falla, trae un regalo cada día y entrega prendas especiales al alcanzar estrellas.
La guía del personaje, la hoja de modelo y los vectores de cada pose están en [`brand/`](brand/README.md).

## El viaje

Cuatro zonas seguidas —**Playa Sol → Selva Eco → Montaña Trueno → Estación Estelar**— con diez paradas cada
una. En cada zona se mezclan las seis actividades, así que nunca hay dos paradas iguales seguidas, y de vez en
cuando irrumpe una sorpresa (una ola, un coco, una roca gigante, un meteorito) que solo se esquiva con una
respuesta rápida.

| Actividad | Qué hace el niño | Matemáticas | Método |
| --- | --- | --- | --- |
| 🧱 **Construye el puente** | Elige las piezas justas para cruzar el río | Valor posicional, decimales, fracciones, porcentajes, «lo que falta» | Montessori (material dorado, error visible) |
| 🎲 **Carrera de dados** | Tira dados y toca la casilla donde aterriza | Suma y resta en la recta numérica, productos, jerarquía, negativos | Concreto → pictórico → abstracto |
| 👣 **Cruza el río** | Salta por las piedras en orden | Ordenar y comparar enteros, decimales, fracciones, negativos y operaciones | Sentido numérico |
| ⚡ **Rompe el escudo** | Fusiona dos cartas para igualar el escudo, contra el reloj | Cálculo mental y tablas | Fluidez + repaso espaciado |
| 💎 **Reparte el tesoro** | Reparte el botín o resuelve un problema con enunciado | División, restos, fracción de una cantidad, porcentajes, problemas | Montessori → modelo de barras (Singapur) |
| 🃏 **Parejas** | Une cada operación con su resultado | Memorización de operaciones | Repaso espaciado |
| ⚡ **Gimnasio Rayo** | Ficha diaria de 12 cálculos con tiempo objetivo | 26 fichas encadenadas | Kumon (precisión + tiempo para avanzar) |

Además:

- **4 itinerarios por edad** (5–6, 7–8, 9–10, 11–12): 40 paradas por itinerario.
- **Enunciados grandes** con los números resaltados, botón de lectura en voz alta y tres pictogramas de «cómo se
  juega» antes de cada actividad. La primera vez, una mano señala dónde tocar.
- **Bloc de notas cuadriculado** dentro de cada juego para hacer las cuentas a mano; pausa el reloj mientras está abierto.
- **Personajes dibujados** (niños y animales) con peinados, sombreros, gafas, ropa y mascotas. Se consiguen con
  puntos de juego o se desbloquean con estrellas. No hay dinero real.
- **Sin rankings**: no hay posiciones ni comparación entre niños; solo estrellas y puntos propios.
- **Nadie se queda atascado**: una parada se abre con una estrella en la anterior o tras tres intentos.
- **Repaso espaciado (Leitner)** de las operaciones falladas y **pistas que retroceden una etapa** en vez de dar la respuesta.
- **Música** con un tema por actividad, generada por la propia app (sin archivos de audio).

## Zona de profes

En «Adultos → Profes» (no hacen falta cuentas):

- **Crear una clase**: se obtiene un código de 6 letras para los alumnos y una clave de profe.
- **Deberes / tema de la semana**: 24 temas (sumas llevando, restas llevando, tablas, fracciones…) con un objetivo
  de estrellas y fecha. Cada tema se practica con actividades distintas que se van alternando.
- **Informe por alumno**: estrellas, minutos de la semana, porcentaje de acierto, deberes hechos y las operaciones
  que más le cuestan.
- **Identificación sin datos personales**: el alumno entra con el código y su **número de lista**. El profe puede
  escribir el nombre junto al número, pero ese nombre se guarda solo en su dispositivo.

### Sentido numérico: cribado orientativo

La profe puede activar para su clase la **Misión Explorador**: cinco pruebas cortas (unos 8 minutos) sobre las
bases del número —contar puntos, comparar cantidades, comparar cifras, situar números en una recta y cálculo
rápido—. El niño la ve como una misión más: no hay reloj en pantalla ni se le dice si acierta, y nunca ve una nota.

La profe ve, por alumno, aciertos y tiempos de cada prueba, con colores que **solo comparan con su propio
grupo** (hacen falta al menos 6 alumnos) y una marca de «conviene observar» cuando las pruebas de base quedan
claramente por debajo.

> **No es un diagnóstico ni una prueba baremada.** Las tareas siguen paradigmas habituales en la investigación
> sobre sentido numérico, pero esta implementación no está validada ni tiene baremos. Sirve para decidir a
> quién observar de cerca y, si el perfil se mantiene, comentarlo con el equipo de orientación. Al tratarse de
> datos de menores sobre posibles dificultades de aprendizaje, conviene usarla con el visto bueno del centro
> y de las familias.

## Ponerlo en marcha

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # pruebas del motor pedagógico
npm run build    # genera dist/ (PWA con funcionamiento sin conexión)
```

## Clases en línea

Sin configurar nada, las clases funcionan solo dentro del dispositivo. Con las dos variables de `.env.example`
definidas se comparten entre dispositivos a través de [Supabase](https://supabase.com); las migraciones están en
`supabase/migrations/` y hay que aplicarlas en orden.

Las tablas están cerradas (RLS sin políticas y sin permisos para la API); la app solo puede llamar a las
funciones `pm_*`. El dispositivo de un niño solo puede leer el nombre de su clase, los deberes y las estrellas
que suma la clase entera; el informe por alumno exige la clave de profe. Cada jugador se identifica con un
secreto que nunca sale de su dispositivo.

## Publicación

`netlify.toml` define la compilación (`npm run build` → `dist/`). El sitio de Netlify publica la rama `main` y
necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ambas públicas por diseño: viajan al navegador).

## Estructura

```
src/core/         motor sin interfaz: currículo, viaje, generadores, temas de deberes, repaso espaciado, guardado
src/core/backend/ clases (local o Supabase)
src/games/        las seis actividades, el evento sorpresa y el Gimnasio Rayo
src/screens/      mapa, armario, clase, zona de adultos y profes
src/ui/           personajes dibujados, bloc de notas y componentes comunes
src/i18n/         textos en ca / es / en
tests/            pruebas del motor (todas las paradas y temas generan problemas resolubles)
supabase/         esquema SQL de las clases en línea
```

Para añadir o ajustar niveles basta con editar `src/core/curriculum.ts` (cada nivel es una línea) y, para los
temas de deberes, `src/core/topics.ts`.

## Apps de móvil y iPad

La web ya es instalable desde el navegador («Añadir a pantalla de inicio») y funciona sin conexión.
Para publicarla en App Store y Google Play se envuelve con [Capacitor](https://capacitorjs.com) sin reescribir nada:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init Matty com.matty.app --web-dir dist
npm run build && npx cap add ios && npx cap add android && npx cap sync
```

(Compilar para iOS requiere un Mac con Xcode y una cuenta de desarrollador de Apple.)
