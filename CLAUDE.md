# Habit Tracker — app web para registrar hábitos

App web pensada para el celular: cada día marcas si cumpliste cada hábito, ves el mes en un calendario de
colores y al final del mes haces una evaluación. Se puede agregar a la pantalla de inicio del iPhone
(Safari → Compartir → Agregar a inicio) y abre como una app.
Todo el texto va en **español colombiano con tuteo** ("marca", "tienes"), nunca voseo.

## Estado

Las 4 pantallas funcionan, `npm run build` pasa sin errores y se revisaron a 390 px de ancho contra `design/`.
Publicada en Vercel desde la rama `main` (cada push a `main` se despliega solo).

## Stack

- Vite + React 18 + TypeScript. Sin librerías de UI ni de rutas.
- Datos en `localStorage` (clave `habitos:v1`), solo en el dispositivo. Sin cuentas.
- Única función de servidor: `api/estimate.ts` (Vercel), que calcula calorías con Claude (`@anthropic-ai/sdk`, búsqueda web
  para marcas). Necesita `ANTHROPIC_API_KEY` en Vercel; `APP_ACCESS_CODE` es opcional (la app lo manda desde "Mi plan").
  En `npm run dev`, `vite.config.ts` sirve la misma función leyendo esas variables de `.env.local`.
- Rutas con `#`: `#/hoy`, `#/hoy/AAAA-MM-DD` (marcar un día pasado), `#/mes`, `#/resumen`, `#/nuevo`, `#/editar/:id`,
  `#/nutricion`, `#/nutricion/AAAA-MM-DD`, `#/seguimiento` y `#/plan`.
- Nutrición se guarda aparte, en la clave `nutricion:v1` (`src/nutrition.tsx`), con la misma regla: no cambiarla sin migración.
  El respaldo JSON lleva los hábitos y además un campo `nutricion`.
- **No cambiar la clave `habitos:v1` ni `version: 1` sin escribir una migración**: si `load()` no reconoce los datos,
  crea los hábitos de ejemplo y borra lo que la persona tenía guardado.
- Fuentes de Google Fonts: Bricolage Grotesque (títulos y números) y DM Sans (texto).

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # revisa tipos y genera dist/
```

## Estructura

```
src/
  main.tsx, App.tsx      Entrada y rutas
  store.tsx              Estado global + guardado en localStorage (hábitos, marcas, reflexiones)
  nutrition.tsx          Estado de nutrición (porciones por día, seguimiento de peso) en `nutricion:v1`
  styles.css             Todos los estilos y los tokens de color
  lib/palette.ts         Colores e íconos de hábito
  lib/dates.ts           Fechas locales (clave 'AAAA-MM-DD', semana de lunes a domingo, formatos en español)
  lib/foods.ts           Grupos, equivalencias, kcal por porción y plan por comida: valores de fábrica + resolveSettings
  lib/ai.ts              Llamada a /api/estimate desde la app
api/estimate.ts          Función de Vercel: alimento escrito → kcal, macros y porciones equivalentes
  lib/stats.ts           TODOS los cálculos: porcentajes, rachas, días perfectos, resumen del mes, calorías, IMC
  lib/types.ts           Tipos de datos
  components/            Icon (íconos de trazo), Common (anillo, flechas, tarjeta de dato, barra inferior)
  components/WeightChart Gráfica de peso (SVG)
  screens/               Today, Month, Summary, HabitForm (crear y editar), Nutrition, Tracking, PlanSettings
public/                  manifest.webmanifest + icon.svg (para "Agregar a inicio")
design/                  Diseños de referencia (.dc.html, se abren en el navegador) y paleta-referencia.png
```

## Diseño (fuente de la verdad: `design/`)

| Token | Hex | Uso |
|---|---|---|
| --bg | `#FBF7F2` | Fondo |
| --surface | `#FFFFFF` | Tarjetas |
| --ink | `#3B1424` | Texto, botones oscuros, día de hoy |
| --muted | `#7A5A66` | Texto secundario |
| --border | `#EFE6E1` | Bordes 1.5 px, puntos vacíos |
| --track | `#F3ECE8` | Fondo de barras |
| --accent | `#BC3157` | Acento (anillo, tarjeta de resumen, pestaña activa) |

Colores de hábito (cada hábito se reconoce por su color):

| Nombre | Hex | Texto encima |
|---|---|---|
| Azul cielo | `#A9CCEA` | ink |
| Mora | `#BC3157` | blanco |
| Avena | `#EAD6AE` | ink |
| Rosa chicle | `#EBB6C9` | ink |
| Lila | `#C6B5E2` | ink |

Los HEX escritos en `paleta-referencia.png` no coinciden con los colores que muestra; se usan los tonos visibles.
Tarjetas con radio de 22–24 px, botones de 44 px como mínimo y 20 px de margen lateral. La columna mide como máximo 480 px.

## Pantallas

1. **Hoy** (`design/Main.dc.html`): fecha, `+`, anillo con % y mensaje, semana L–D con un punto por hábito,
   lista de hábitos. Tocar el check marca o desmarca; la tarjeta se llena con el color del hábito.
   Tocar el nombre abre la edición. Tocar un día de la semana (o un día en el Mes) abre ese día para marcarlo;
   los días futuros no se pueden abrir.
2. **Mes** (`design/Mes.dc.html`): calendario con flechas y filtros. "Todos" muestra un punto por hábito
   en cada día; con un hábito elegido, los días cumplidos se pintan de su color. Debajo hay 2 tarjetas de datos.
3. **Resumen** (`design/Resumen.dc.html`): evaluación del mes (abre en el mes anterior si ya había hábitos).
   Muestra % y veredicto, barras por hábito con la mejor racha, el mapa del mes, "Tu fuerte" / "A mejorar",
   y al final el ánimo y la nota. Debajo, "Tus datos": descargar y cargar un respaldo en JSON.
4. **Nuevo / Editar hábito** (`design/NuevoHabito.dc.html`): vista previa en vivo; nombre, detalle,
   color, ícono, días y "¿Desde cuándo?" (fecha de inicio, `createdAt`). Al editar aparece también "Eliminar hábito".
5. **Nutrición** (`#/nutricion`, sin diseño de referencia; usa los mismos tokens): pestañas Día / Seguimiento / Mi plan.
   - **Día:** anillo con las kcal del día contra la meta, proteína y grasa; selector de comida (se elige solo según la hora);
     "Calcular con IA" (escribe el alimento → kcal y porciones; guarda los últimos 12 para reusarlos);
     una tarjeta por grupo con porciones de hoy / meta y lo que pide el plan en esa comida. El `+` abre las equivalencias
     del grupo (o "Otro" escrito a mano); al elegir una se pregunta "¿Cuánto comiste?" con la cantidad de la equivalencia
     (100 g de arroz con base 80 g = 1,25 harinas). En agua suma un vaso directo. Debajo, "Lo que comiste" por comida: cada
     registro se puede ajustar (cantidad), pasar a otra comida (selector) o quitar. Lo calculado con IA no se ajusta: se recalcula.
   - **Seguimiento:** gráfica de peso vs. fecha y un registro por fecha con peso, IMC y % grasa. Con la estatura, el IMC se calcula solo.
   - **Mi plan:** meta de kcal, porciones por comida (el total del día es la suma), equivalencias por grupo (formato
     "Alimento · cantidad", pueden valer más de 1 porción), lo que aporta 1 porción y el código de la IA.

## Reglas de datos (`src/lib/stats.ts`)

- `checks['AAAA-MM-DD']` = ids de los hábitos cumplidos ese día. Si un hábito no aparece, no se cumplió.
- Un hábito cuenta solo los días programados (`weekdays`, 0 = domingo) y desde su `createdAt`.
- Marcar un día anterior a `createdAt` mueve `createdAt` a ese día (los días sin marcar entre ambos cuentan como no cumplidos).
- % = días cumplidos / días programados hasta hoy. Los días futuros no cuentan.
- Día perfecto = todos los hábitos programados ese día cumplidos.
- Racha actual = días programados seguidos cumplidos; si hoy aún no se marca, la racha no se rompe.
- Veredicto: ≥85 "¡Mes increíble!", ≥70 "¡Muy buen mes!", ≥50 "Buen avance", menos "Mes para retomar".
- Nutrición: un registro cuenta `portions` (1 por defecto) de su grupo (si trae `base`, `portions` = base.portions × qty / base.qty), o `split` si vino de la IA; suma las kcal/proteína/grasa
  de "Mi plan" (`settings.values`), salvo que el registro traiga las suyas (IA). Valores de fábrica por porción: lácteos 90,
  proteínas 170, harinas 90, grasas 42,3, frutas 80, dulce 90; verduras y agua 0. `settings` guarda solo lo que se cambió.
- La primera vez se crean 5 hábitos: tomar agua, hacer ejercicio, seguir la dieta, sin azúcar y skin care.

## Reglas para cambios

- Los cálculos van en `lib/stats.ts`; las pantallas solo muestran.
- Accesibilidad: usar `<button>`/`<a>` reales, `aria-label` en los botones con solo ícono, `aria-pressed` en los
  selectores y contraste AA.
- Probar siempre a 390 px de ancho (iPhone).

## Siguientes pasos posibles

- **Publicarla con un link:** subirla a Vercel o Netlify (`npm run build`, carpeta `dist/`).
- **Sincronizar entre dispositivos:** agregar cuentas y una base de datos (por ejemplo Supabase o Firebase).
- **Que funcione sin internet:** agregar un service worker (vite-plugin-pwa).
- **Más funciones:** reordenar hábitos, modo oscuro, y límite de consultas a la IA por día.
