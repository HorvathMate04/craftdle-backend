import { IControls } from "./IControls.interface"

export interface ISettings {
    id: number,
    volume: number,
    imagesSize: number,
    isSet: boolean,
    controls: IControls,
}