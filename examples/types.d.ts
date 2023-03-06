export function assertPetId(data: unknown): asserts data is PetId;
export function isPetId(data: unknown): data is PetId;
export type PetId = string;
export function assertPetStatus(data: unknown): asserts data is PetStatus;
export function isPetStatus(data: unknown): data is PetStatus;
export enum PetStatus {
    'AVAILABLE' = 'AVAILABLE',
    'PENDING' = 'PENDING',
    'SOLD' = 'SOLD',
}
export function assertPet(data: unknown): asserts data is Pet;
export function isPet(data: unknown): data is Pet;
export interface Pet {
    'name': string;
    'status'?: PetStatus;
}
export function assertAnonymous1(data: unknown): asserts data is Anonymous1;
export function isAnonymous1(data: unknown): data is Anonymous1;
/** OK */
export interface Anonymous1 {
    'statusCode': 200;
    'json': Pet;
}
export function assertAnonymous3Json(data: unknown): asserts data is Anonymous3Json;
export function isAnonymous3Json(data: unknown): data is Anonymous3Json;
export interface Anonymous3Json {
}
export function assertAnonymous3(data: unknown): asserts data is Anonymous3;
export function isAnonymous3(data: unknown): data is Anonymous3;
/** Not Found */
export interface Anonymous3 {
    'statusCode': 404;
    'json'?: Anonymous3Json;
}
export function assertUpdatePetResponse(data: unknown): asserts data is UpdatePetResponse;
export function isUpdatePetResponse(data: unknown): data is UpdatePetResponse;
export type UpdatePetResponse = Anonymous1 | Anonymous3;
export function assertUpdatePetRequestPathParameters(data: unknown): asserts data is UpdatePetRequestPathParameters;
export function isUpdatePetRequestPathParameters(data: unknown): data is UpdatePetRequestPathParameters;
export interface UpdatePetRequestPathParameters {
    'petId': PetId;
}
export function assertUpdatePetRequest(data: unknown): asserts data is UpdatePetRequest;
export function isUpdatePetRequest(data: unknown): data is UpdatePetRequest;
export interface UpdatePetRequest {
    'pathParameters': UpdatePetRequestPathParameters;
    'json': Pet;
}
export * from '@emdgroup/tapir/dist/error.js';
export type Operation =
    'UpdatePet';
export type Route<L, K> = [L, K];
export type UpdatePetRoute = Route<UpdatePetRequest, UpdatePetResponse>;
export const validators: {
    UpdatePet: {
        isRequest(arg: unknown): arg is UpdatePetRequest;
        isResponse(arg: unknown): arg is UpdatePetResponse;
        assertRequest(arg: unknown): asserts arg is UpdatePetRequest;
        assertResponse(arg: unknown): asserts arg is UpdatePetResponse;
    },
};
export const routes: { [key: string]: Operation | undefined };
