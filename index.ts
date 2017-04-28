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
function randomString(instance: any) {
        return Math.random().toString(36).substr(2, 9);
}


function mapInstance(map: Map<any, InstanceValue>, obj: any) {
    var nueva = { valor: obj, cont: 1 }
    const resultado = map.get(obj);
    if (resultado == null) {
        const cadena = randomString(obj);
        map.set(obj, { cadena, referencias: 0 });
        return cadena;
    }
    return resultado.cadena;
}

/**Regresa la cadena que hace referencia a los argumentos de la función en el mapa que recibe; si los argumentos no existen en el mapa los agrega */
function mapArgsToString(map: Map<any, InstanceValue>, arr: any[]) {
    var res = arr.map(x => mapInstance(map,x));
    return res;
}

/**Store function memoized results. Do not use this class directly, instead use the memoize function*/
class MemoizeMap {
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
        return mapArgsToString(this.mapaInstancias, args);
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
 * @param maxDepth Max number of different function results to store in memory. Default is 10
 */
function memoize<T extends (...args) => any>(func: T, maxDepth: number = 10): T {
    const mapInstance = new MemoizeMap(maxDepth);
    const ret = (function () {
        const args: any[] = [];
        for (var i = 0; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        return mapInstance.getResult(args, func);
    }) as any;

    //Set the map instance for testing pruposes
    ret.mapInstance = mapInstance;
    return ret;
}

export = memoize;