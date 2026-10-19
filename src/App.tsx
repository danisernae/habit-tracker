import { useEffect, useState } from 'react';
import { BottomNav, type Route } from './components/Common';
import { HabitForm } from './screens/HabitForm';
import { Month } from './screens/Month';
import { Summary } from './screens/Summary';
import { Today } from './screens/Today';

/** Rutas con # para que funcione en cualquier hosting estático: #/hoy, #/mes, #/resumen, #/nuevo, #/editar/:id */
function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  const [, section, param] = hash.replace(/^#/, '').split('/');

  if (section === 'nuevo') return <HabitForm key="nuevo" />;
  if (section === 'editar' && param) return <HabitForm key={param} habitId={param} />;

  const route: Route = section === 'mes' || section === 'resumen' ? section : 'hoy';
  return (
    <>
      {route === 'hoy' && <Today />}
      {route === 'mes' && <Month />}
      {route === 'resumen' && <Summary />}
      <BottomNav current={route} />
    </>
  );
}
