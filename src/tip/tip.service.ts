import { Injectable } from '@nestjs/common';

@Injectable()
export class TipService {

    checkTutorialScript(group: string, numberOfGuess: number) {
        const scriptedTip = ["planks0", "armorStand0", "rail0", "piston0", "axe0"];
        return group == scriptedTip[numberOfGuess]
    };
}
