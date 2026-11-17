# Matty 🎲

Un viaje de aventuras donde las matemáticas son la mecánica del juego, para niños y niñas de 5 a 12 años.
En **catalán, castellano e inglés**. Web app instalable (PWA) pensada para móvil, tableta y ordenador.

> El niño no «hace ejercicios»: construye puentes, cruza ríos, rompe escudos y reparte tesoros.
> Para conseguirlo tiene que contar, ordenar, componer números, calcular y memorizar.

## Matty

La mascota: un pequeño astronauta de cara turquesa que guía el viaje, da pistas desde la barra de cada juego,
anima cuando algo falla, trae un regalo cada día y entrega prendas especiales al alcanzar estrellas. Al pasar un
nivel se gana una **copa** con una imagen para guardar o compartir, con la marca y sin datos del niño.
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
- **Personajes a medida**: la cara se monta pieza a pieza (piel, forma, 15 peinados, ojos y su color, cejas,
  nariz, boca y mejillas; más de un millón de combinaciones, todas gratis) o se elige un animal. Encima van
  sombreros, gafas, ropa y mascotas, que se consiguen con puntos de juego o con estrellas. No hay dinero real.
- **Primeros minutos pensados para enganchar**: Matty cuenta por qué importa el viaje (su cohete funciona con
  estrellas), cada zona empieza con la carrera de dados, las tres primeras paradas son cortas la primera vez,
  las respuestas seguidas encienden una racha y la primera estrella trae un regalo que se pone con un toque.
- **Sin rankings**: no hay posiciones ni comparación entre niños; solo estrellas y puntos propios.
- **Nadie se queda atascado**: una parada se abre con una estrella en la anterior o tras tres intentos.
- **Repaso espaciado (Leitner)** de las operaciones falladas y **pistas que retroceden una etapa** en vez de dar la respuesta.
- **Música** con un tema por actividad, generada por la propia app (sin archivos de audio).
- **Escenarios en capas**: el suelo de cada zona son recortes superpuestos con sombra, los elementos (palmeras,
  cabañas, planetas…) están sombreados con degradados y todo lleva un grano de papel por encima. Está dibujado
  por la propia app en `src/ui/scene.tsx`, sin imágenes externas, así que pesa poco y funciona sin conexión.

## Temporadas

Durante unas semanas el juego entero se disfraza: decoración sobre el mapa, Matty con gorro, prendas especiales
en el armario (solo se venden en temporada, pero se conservan) y un **mundo extra** de cinco paradas con un
premio al completarlo. Ahora hay dos: **Halloween** (17 oct – 2 nov) y **Navidad** (1 dic – 6 ene). Se activan
solas por fecha; en «Adultos → Ajustes» se pueden desactivar o fijar una para verla fuera de fecha.

Lanzar una temporada nueva (carnaval, verano…) es:

1. Añadir su entrada en `src/core/seasons.ts`: fechas, prendas, premio y temas de su mundo por edad.
2. Dibujar su ambientación en `src/ui/scene.tsx` (franjas de terreno y elementos) y lo que cae del cielo en
   `src/ui/Season.tsx`; los colores van en `src/styles/scenes.css`.
3. Dibujar sus prendas en `src/ui/Character.tsx` y darlas de alta en `src/core/look.ts`.
4. Poner sus textos en `src/i18n/` (`season.<id>…`).

Las pruebas comprueban que las temporadas no se solapan y que todo lo que nombran existe.

## Área docente (`/docente`)

Las docentes tienen su propio sitio en `…/docente`, con **cuenta y contraseña**. Dentro ven todas sus clases con
sus cifras de la semana y, al abrir una, su panel completo:

- **Indicadores**: cuántos han jugado esta semana, cuántos siguen la rutina, minutos de media y acierto.
- **Habilidades**: una barra por habilidad (valor posicional, recta numérica, ordenar, cálculo mental, reparto y
  problemas, memoria de operaciones) con el punto fuerte de la clase y lo que conviene reforzar.
- **Semana a semana**: los minutos de la clase en las últimas semanas.
- **Seguimiento por alumno**: tiempo de la semana y total, días jugados frente a la rutina, acierto, qué reforzar,
  las operaciones que falla y una **nota** de la docente. Se ordena por columnas y se descarga para Excel.
- **Tarjetas de acceso**: una por alumno, para imprimir, con un **código QR** que lo mete directamente en la clase
  con su número (en el aula o en casa), y una nota para las familias.
- Además de lo de siempre: deberes, mundo de la clase y Misión Explorador.

La **rutina recomendada** es de 4 días por semana, unos 15 minutos cada día; el niño la ve en el mapa como
cuatro puntos junto a sus estrellas. La idea de la rutina corta y constante, la cuenta del centro que reparte
accesos y los informes por habilidades están tomadas de cómo funciona
[Dytective](https://www.changedyslexia.org/) (lectoescritura); aquí aplicadas a las matemáticas.

**Privacidad.** Los alumnos siguen sin cuenta: entran con el código de la clase y su número de lista. La cuenta
de la docente es un llavero: recuerda qué clases son suyas. Los nombres y las notas que escribe junto a cada
número se quedan en su dispositivo salvo que active «Guardar nombres y notas en la nube», que los sube para
verlos desde cualquier dispositivo y los borra del servidor al desactivarlo.

**Puesta en marcha de las cuentas** (una vez, en el panel de Supabase → Authentication):

- El correo que Supabase trae por defecto solo envía a los miembros del proyecto. Para que cualquier docente
  pueda registrarse hay que conectar un servicio de correo propio (SMTP), o bien desactivar «Confirm email»
  mientras dure el piloto. Recuperar la contraseña también depende del correo.
- En «URL Configuration», añadir `https://<tu-dominio>/docente` a las direcciones de redirección.

Sin nube configurada (tableta sin internet, desarrollo) `/docente` funciona sin cuenta con las clases del dispositivo.

## Portal de familias (`/familia`)

Madres, padres y tutores tienen su propio sitio en `…/familia`, con la misma cuenta y contraseña que usarían
como docentes. Por dentro una familia es un grupo pequeño como una clase, así que comparte toda su maquinaria;
un niño puede estar a la vez en su clase y en su familia.

- **Conectar**: la familia tiene un código y un QR. El niño lo escanea (o lo escribe en «Adultos → Familia») y su
  juego queda conectado, sin cuenta ni datos personales.
- **Misión de casa**: un tema y unas estrellas que conseguir, con unas palabras de ánimo y, si quieren, un premio.
  El niño la ve en su mapa con el mensaje de su familia.
- **Objetivo semanal**: días por semana y minutos al día; el niño lo ve como puntos que se van llenando.
- **Mundo de la familia**: el mismo editor que usan las profes, para los deberes del cole o lo que más cuesta.
- **Resumen de la semana**: un párrafo por hijo en lenguaje llano (días jugados, minutos, acierto, punto fuerte,
  qué le cuesta, cómo va la misión) y una idea para practicar en casa. Se puede copiar para compartirlo.

El resumen se lee en el portal. Enviarlo por correo cada semana queda pendiente de tener un dominio de correo
propio (lo mismo que hace falta para confirmar cuentas y recuperar contraseñas).

## Zona de profes dentro del juego

La misma gestión de una clase está también en «Adultos → Profes», sin cuenta, con el código y la clave de la clase:

- **Crear una clase**: se obtiene un código de 6 letras para los alumnos y una clave de profe.
- **Deberes / tema de la semana**: 24 temas (sumas llevando, restas llevando, tablas, fracciones…) con un objetivo
  de estrellas y fecha. Cada tema se practica con actividades distintas que se van alternando.
- **Mundo de la clase**: la profe monta un camino de hasta 8 paradas y lo lanza al mapa de sus alumnos. Cada
  parada es un tema ya preparado o **ejercicios escritos por ella**, uno por línea:

  ```
  23 + 48                      → la app calcula la respuesta
  3 x ? = 12                   → la app encuentra el hueco
  Lados de un hexágono = 6     → cualquier pregunta, con su respuesta tras «=»
  ```

  Puede empezar desde una plantilla (todas las paradas de sumas, de restas…), elegir la ambientación y reordenar.
  En el informe ve las estrellas de cada alumno por parada y los ejercicios que más se fallan. Lo que escribe
  nunca se ejecuta como código: solo se lee como números y signos.
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

## Planes (preparado; hoy todo es gratis)

Los niños nunca pagan ni ven un precio: si algún día se cobra, se cobra a adultos (familias, docentes, centros)
desde la web, nunca dentro del juego. El terreno está preparado así:

- Cada cuenta de adulto tiene un plan (`free`, `family`, `teacher`, `school`) en la tabla `pm_accounts`
  (`supabase/migrations/0008_plans.sql`). La app no puede leer ni escribir esa tabla: solo pregunta por su propio
  plan con `pm_account()`. Un plan caducado vuelve a ser `free` sin borrar nada.
- Lo que permite cada plan se decide en un solo sitio, la función `pm_plan_limits`. Hoy todos los planes permiten
  lo mismo que antes (40 clases y familias por cuenta).
- Un plan se asigna desde el servidor. Mientras no haya pasarela de pago, a mano (un centro que paga con factura):

  ```sql
  select pm_admin_set_plan('profe@colegio.es', 'school', '2027-09-01', 'manual', 'Factura 2026-001');
  ```

  El día que se conecte una pasarela, su aviso de pago llama a esa misma función.
- En la app, `src/core/plans.ts` interpreta el plan (cualquier cosa desconocida o caducada es `free`, para que
  una copia antigua nunca deje a nadie fuera) y el portal lo muestra junto al correo cuando no es el gratuito.

Cuando se decida qué es de pago, el bloqueo real de una función va en su función `pm_*` del servidor (mirando el
plan de la cuenta dueña de la clase), no solo en la pantalla.

## Publicación

`netlify.toml` define la compilación (`npm run build` → `dist/`). El sitio de Netlify publica la rama `main` y
necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ambas públicas por diseño: viajan al navegador).

## Estructura

```
src/core/         motor sin interfaz: currículo, viaje, generadores, temas de deberes, mundos, temporadas, guardado
src/core/backend/ clases (local o Supabase)
src/games/        las seis actividades, el reto de la profe, el evento sorpresa y el Gimnasio Rayo
src/screens/      mapa, mundos extra, armario, clase, zona de adultos y profes
src/ui/           personajes y escenarios dibujados, bloc de notas y componentes comunes
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
