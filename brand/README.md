# Matty · guía de personaje

Matty es la mascota y la cara del proyecto: un pequeño astronauta de cara turquesa que acompaña al niño
en todo el viaje, de la playa al espacio. Este directorio reúne lo necesario para usarlo fuera de la app
(vídeo, impresos, producto).

![Hoja de modelo](matty-hoja-de-modelo.png)

## Quién es

- **Qué es**: un astronauta pequeño y cabezón. Tras el visor redondo asoma una cara turquesa: no es un niño
  ni un animal conocido, así que cualquiera puede verse en él.
- **Carácter**: curioso, paciente y animoso. Nunca riñe ni se burla; cuando algo sale mal, se preocupa un
  segundo y enseguida propone otra forma de mirarlo.
- **Papel en el juego**
  - **Guía**: saluda, presenta cada actividad y señala qué hacer a continuación en el mapa.
  - **Pistas**: su cara está en la barra de cada juego; al tocarla da un consejo y activa las ayudas en pantalla.
  - **Ánimo**: celebra los aciertos y acompaña los fallos.
  - **Regalos**: trae un regalo cada día y entrega prendas especiales al alcanzar estrellas (la primera, una
    diadema con sus auriculares y su antena). Al pasar un nivel aparece celebrando en la copa.
- **Cómo habla**: frases cortas, en segunda persona, siempre en positivo. Da la pista, nunca la respuesta.
  «Cuenta cuánto llevas y cuánto te falta.» · «¡Te acompaño!» · «Mañana te traigo otro.»

## Cómo es

| Rasgo | Detalle |
| --- | --- |
| Silueta | Casco redondo muy grande sobre un cuerpo pequeño (proporción de muñeco: la cabeza es más de la mitad) |
| Cara | Turquesa, dentro del visor: ojos grandes y ovalados con dos brillos, mofletes rosas, boca pequeña |
| Casco | Blanco, con dos auriculares amarillos a los lados, un reflejo en el cristal y una antena inclinada |
| Antena | Termina en el destello de cuatro puntas («+»): es su rasgo más propio |
| Traje | Blanco, con mochila gris, panel en el pecho con el destello, y guantes y botas amarillos |
| Motivo | El mismo destello, suelto, cuando celebra o da una pista |

### Colores

| Uso | Hex |
| --- | --- |
| Turquesa Matty (cara) | `#35c9b8` |
| Blanco traje (casco y traje) | `#f7f9fc` |
| Gris mochila (mochila y cuello) | `#c7d0e0` |
| Amarillo sol (guantes, botas, auriculares, destello) | `#ffd23f` |
| Menta panel (pecho) | `#e6fff7` |
| Mofletes | `#ff9fb5` |
| Tinta (contorno, ojos) | `#23164f` |
| Violeta de marca (fondos) | `#7c4dff` |

### Poses

`matty-hi.svg` (saluda) · `matty-happy.svg` (contento) · `matty-cheer.svg` (celebra) ·
`matty-think.svg` (piensa / pista) · `matty-oops.svg` (anima tras un fallo) · `matty-gift.svg` (regala) ·
`matty-wow.svg` (sorpresa) · `matty-point.svg` (señala).

Son vectores independientes, con los colores ya resueltos: se pueden abrir en Illustrator, Figma, Inkscape
o After Effects. Cada parte (traje, casco, cara, brazos, antena) es una forma separada, lo que facilita
animarlo por piezas.

## Normas de uso

- Mantener siempre el contorno de tinta, la cara turquesa y la antena con el destello: sin ellos es un astronauta cualquiera.
- No cambiar el turquesa de la cara ni estirar la figura. Para una edición especial, cambiar el color de los
  guantes, botas y auriculares, no el de la cara.
- Tamaño mínimo de cuerpo entero: 34 px en pantalla. Por debajo, usar solo el casco.
- Funciona sobre claros, oscuros y los colores del juego; sobre blanco puro, mantener el contorno bien visible.
- Nunca enfadado, triste de verdad ni burlón. Su gesto más serio es el de «anima».

## La copa

Al pasar un nivel el niño gana una copa (bronce, plata u oro según las estrellas) y puede guardar o compartir
una imagen cuadrada de 1080 px con la copa, Matty celebrando, su propio personaje, el nombre de la marca y la
dirección de la web. La imagen **no incluye el apodo ni ningún dato del niño**. Se genera en `src/ui/Trophy.tsx`.

## De dónde sale

El dibujo maestro es código: `src/ui/Matty.tsx`. La hoja de modelo se ve en `/brand.html` con el servidor de
desarrollo (`npm run dev`) y de ahí se exportan estos archivos y el icono de la app (`public/icon.svg`).
Cualquier cambio de forma o color debe hacerse allí y volver a exportarse, para que app y materiales no se separen.

## Antes de fabricar o registrar

- El diseño es original de este proyecto, pero **no se ha hecho ninguna búsqueda de marcas ni de diseños
  registrados**. Antes de invertir en producto conviene encargarla (OEPM / EUIPO).
- El **nombre «Matty»** merece comprobación específica en la clase de juguetes: Mattel ha usado «Matty» como
  nombre de mascota y de tienda. Para una app educativa el riesgo es distinto que para merchandising.
- Los astronautas simpáticos abundan como mascotas: lo que hace reconocible a este es la combinación de cara
  turquesa, auriculares amarillos y antena con destello. Conviene no perderla en ninguna adaptación.
- Es un personaje hecho en vectores sencillos y pensado para pantalla. Para peluche, animación o imprenta a
  gran tamaño lo habitual es que un ilustrador lo pase a limpio (giros de cabeza, tres cuartos, espalda).
