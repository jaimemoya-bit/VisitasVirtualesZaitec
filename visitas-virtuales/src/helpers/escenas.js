// Mapeo de ID de centro (BD) al índice de escena en el build de Unity.IMPORTANTE: Debe coincidir exactamente con el orden de las escenas
// Escena 0: Bootstrap (arranque), Escena 1: Madrid, Escena 2: Córdoba las que tenemos
// Los centros sin escena propia apuntan a la escena 1 como fallback por ahora
export const ESCENAS_POR_CENTRO = {
	1: 1, // Instituto Madrid → Escena 1
	2: 4, // Instituto Pacífico → Escena 4
	3: 3, // Instituto Jerez → Escena 3
	4: 2, // Instituto Córdoba → Escena 2
};
