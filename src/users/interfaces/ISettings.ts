import { IControls } from "./IControls"

export interface ISettings {
    id: number,
    volume: number,
    imagesSize: number,
    isSet: boolean,
    controls: IControls,
}