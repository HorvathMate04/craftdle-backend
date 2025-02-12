interface ISuccessResponse<T = any> {
    data?: T; // A sikeres válasz opcionálisan tartalmazhat adatokat
    message?: string; // Opcionális üzenet
}

interface IErrorResponse {
    message: []; // A hibás válasz mindig tartalmaz egy üzenetet
}

// Union típus a visszatérési értékhez
export type ApiResponse<T = any> = ISuccessResponse<T> | IErrorResponse;