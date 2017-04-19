interface InstanceValue {
    /**Cadena unica que representa a esa instancia */
    cadena: string;
    /**Cantidad de veces a la que se hace referencia a esta instancia */
    referencias: number;
}

interface ResultValue {
    /**Valor que devolvio la funcion para estos argumentos */
    value: any;
}


/**Regresa la cadena que hace referencia a los argumentos de la función en el mapa que recibe; si los argumentos no existen en el mapa los agrega */
function mapArgsToString(set: (instancia, cadena: string) => void, get: (instancia) => string | undefined, arr: any[]) {
    const randomString = () => Math.random().toString(36).substr(2, 9);

    function mapInstance(obj: any) {
        var nueva = { valor: obj, cont: 1 }
        const resultado = get(obj);
        if (resultado == null) {
            const cadena = randomString();
            set(obj, cadena);
            return cadena;
        }
        return resultado;
    }
    var res = arr.map(x => mapInstance(x));
    return res;
}

/**Store function memoized results. Do not use this class directly, instead use the memoize function*/
export class MemoizeMap {
    /**@param maxDepth Max number of function results to sotre */
    constructor(maxDepth: number) {
        this.maxDepth = maxDepth;
    }

    /**Profundidad maxima */
    public maxDepth: number;
    public get instanceMapCount() {
        return this.mapaInstancias.size;
    }
    public get resultMapCount() {
        return this.mapaResultados.size;
    }

    /**Mapea las instancias de los argumentos a un identificador de cadena */
    private mapaInstancias = new Map<any, InstanceValue>();
    /**Mapea los identificadores de cadenas del conjunto de argumentos a los resultados de las funciones */
    private mapaResultados = new Map<string, ResultValue>();
    /**Lleva los argumentos mas recientes*/
    private ultimosArgumentos: (any[])[] = [];

    /**Agrega un resultado de la evaluacion de una funcion
     * @param args Los argumentos que se le pasaron a la funcion
     * @param resultado El resultado que devolvio la funcion
     */
    private addArgs(args: any[]) {
        const set = (instancia, cadena: string) => {
            this.mapaInstancias.set(instancia, { cadena: cadena, referencias: 0 });
        };

        const get = (instancia) => {
            const valor = this.mapaInstancias.get(instancia);
            return valor && valor.cadena;
        }
        return mapArgsToString(set, get, args);
    }

    private obtenerResultado(argsCadena: string, calcular: () => any) {
        const valor = this.mapaResultados.get(argsCadena);
        if (valor)
            return { value: valor.value, enCache: true };
        else {
            const resultado = calcular();
            this.mapaResultados.set(argsCadena, { value: resultado });
            return { value: resultado, enCache: false };
        }
    }

    /**Suma un valor a la cantidad de referencias que tiene una instancia en el mapa de instancias */
    private sumarReferencia(instancia: any, suma: number) {
        this.mapaInstancias.get(instancia) !.referencias += suma;
    }

    /**Borra un resultado del mapa de resultado y libera las instancias que ya no tengan referencias */
    private borrarResultado(args: any[]) {
        var instancias = args.map(x => ({ cadena: this.mapaInstancias.get(x) !, instancia: x }));
        var key = instancias.map(x => x.cadena.cadena).join("_");
        //Lo borramos del mapa de resultados:
        this.mapaResultados.delete(key);

        //Disminuimos las referencias, borrando las que lleguen a 0
        for (var a of instancias) {
            a.cadena.referencias--;
            if (a.cadena.referencias == 0) {
                this.mapaInstancias.delete(a.instancia)
            }
        }
    }

    /**Actualiza las referencias y si se ha superado la profundidad maxima, libera la memoria del resultado de la funcion mas antiguo */
    private actualizarReferencias(args: any[]) {
        //Suma una referencia
        for (var instancia of args) {
            this.sumarReferencia(instancia, 1);
        }

        this.ultimosArgumentos.push(args);

        if (this.ultimosArgumentos.length > this.maxDepth) {
            //Borrar el argumento mas viejo:
            const ultimo = this.ultimosArgumentos[0];
            this.ultimosArgumentos.splice(0, 1);

            this.borrarResultado(ultimo);
        }
    }

    getResult(args: any[], funcion: (...args) => any) {
        const argStr = this.addArgs(args);
        const ret = this.obtenerResultado(argStr.join("_"), () => funcion(...args));

        if (!ret.enCache)
            this.actualizarReferencias(args);

        return ret.value;
    }
}

/**
 * Returns a memoized function that returns the same result when is called with the same arguments. The arguments are compared by reference
 * @param func The function to memorize
 * @param maxDepth Max number of different function results to store in memory. Default is 5
 */
export function memoize<T extends (...args) => any>(func: T, maxDepth: number = 5): T {
    const mapa = new MemoizeMap(maxDepth);
    return (function () {
        const args: any[] = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        return mapa.getResult(args, func);
    }) as any;
}

