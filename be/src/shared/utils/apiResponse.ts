export class ApiResponse<T> {
    constructor(
        public statusCode: number,
        public message: string,
        public data: T | null = null,
        public status: string = 'success'
    ) { }

    static success<T>(message: string, data: T | null = null, statusCode: number = 200) {
        return new ApiResponse<T>(statusCode, message, data, 'success');
    }

    static created<T>(message: string, data: T | null = null) {
        return new ApiResponse<T>(201, message, data, 'success');
    }
}
