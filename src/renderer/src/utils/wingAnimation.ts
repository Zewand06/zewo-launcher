import { PlayerAnimation, type PlayerObject } from 'skinview3d'

const REST_WING_X = 0.2617994
const REST_WING_Z = 0.2617994

// IdleAnimation'ın kol/cape sallanmasını korur, üstüne kanatlara sürekli,
// hafif bir çırpınma (flutter) ekler — skinview3d'nin FlyingAnimation'ı tek
// seferlik bir "uçuşa geçiş" pozu olduğu için burada kendi animasyonumuzu
// yazmamız gerekti.
export class AmbientWingAnimation extends PlayerAnimation {
  protected animate(player: PlayerObject): void {
    const t = this.progress * 2

    const basicArmRotationZ = Math.PI * 0.02
    player.skin.leftArm.rotation.z = Math.cos(t) * 0.03 + basicArmRotationZ
    player.skin.rightArm.rotation.z = Math.cos(t + Math.PI) * 0.03 - basicArmRotationZ

    const basicCapeRotationX = Math.PI * 0.06
    player.cape.rotation.x = Math.sin(t) * 0.01 + basicCapeRotationX

    const flutterZ = Math.sin(this.progress * 2.4) * 0.16
    const flutterX = Math.sin(this.progress * 1.6 + 1) * 0.06
    player.elytra.leftWing.rotation.z = REST_WING_Z + flutterZ
    player.elytra.leftWing.rotation.x = REST_WING_X + flutterX
    player.elytra.updateRightWing()
  }
}
