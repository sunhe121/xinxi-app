import { Phone, MessageCircle, Heart, ChevronDown } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FFF8F3] flex justify-center">
      <div className="w-full max-w-[375px] bg-[#FFF8F3] overflow-hidden">
        {/* ===== 第一屏：封面 ===== */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center px-8 text-center overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, #FFB347 0%, #FF8C69 70%, #FF7A5C 100%)',
          }}
        >
          {/* 声音波纹装饰 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-48 h-48 rounded-full border border-white/20 animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute w-72 h-72 rounded-full border border-white/15 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            <div className="absolute w-96 h-96 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </div>

          <div className="relative z-10">
            <h1 className="text-7xl font-bold text-white mb-6 tracking-wider">
              心系
            </h1>
            <p className="text-2xl text-white/95 mb-10 font-light">
              让爱，不用开口
            </p>
            <p className="text-base text-white/75 leading-relaxed max-w-xs mx-auto">
              有些关心，不好意思说出口；
              <br />
              有些想念，怕打扰对方。
              <br />
              现在，有人替你说。
            </p>
          </div>

          {/* 向下箭头 */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
            <ChevronDown size={32} />
          </div>
        </section>

        {/* ===== 第二屏：你是不是也这样？ ===== */}
        <section className="py-20 px-6 bg-[#FFF8F3]">
          <h2 className="text-3xl font-bold text-[#4A3F3A] text-center mb-12">
            你是不是也这样？
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF8C69]/15 flex items-center justify-center flex-shrink-0">
                <Phone size={22} className="text-[#FF8C69]" />
              </div>
              <p className="text-[#4A3F3A] leading-relaxed text-base pt-1">
                在外地工作，想给爸妈打电话，又怕他们担心我过得不好
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF8C69]/15 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={22} className="text-[#FF8C69]" />
              </div>
              <p className="text-[#4A3F3A] leading-relaxed text-base pt-1">
                "妈，记得吃药" 这句话在输入框里打了又删，始终没发出去
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#FF8C69]/15 flex items-center justify-center flex-shrink-0">
                <Heart size={22} className="text-[#FF8C69]" />
              </div>
              <p className="text-[#4A3F3A] leading-relaxed text-base pt-1">
                爸妈想你了，拿起电话又放下，怕耽误你工作
              </p>
            </div>
          </div>

          <p className="text-center text-[#B8860B] mt-10 text-lg font-medium italic">
            不是不关心，是不知道怎么关心。
          </p>
        </section>

        {/* ===== 第三屏：「心系」是什么 ===== */}
        <section className="relative py-20 px-6 bg-white overflow-hidden">
          {/* 装饰圆点 */}
          <div className="absolute top-12 left-6 w-3 h-3 rounded-full bg-[#FF8C69]/20" />
          <div className="absolute top-24 right-10 w-2 h-2 rounded-full bg-[#FFB347]/30" />
          <div className="absolute bottom-32 left-12 w-4 h-4 rounded-full bg-[#FF8C69]/15" />
          <div className="absolute bottom-16 right-6 w-2 h-2 rounded-full bg-[#FFB347]/25" />
          <div className="absolute top-1/3 right-20 w-1.5 h-1.5 rounded-full bg-[#FF8C69]/30" />

          <p className="text-sm text-[#8B7D75] text-center mb-4 tracking-wide">
            「心系」是什么
          </p>
          <h2 className="text-3xl font-bold text-[#FF8C69] text-center mb-8 leading-snug">
            一个帮你把关心
            <br />
            说出口的AI工具。
          </h2>
          <p className="text-[#8B7D75] text-center leading-relaxed mb-10 text-base">
            每天自动了解你和家人的生活状态，
            <br />
            用你自己的声音，生成一段温暖的每日播报，
            <br />
            发给对方。
          </p>

          <div
            className="rounded-2xl py-6 px-8 text-center"
            style={{
              background:
                'linear-gradient(135deg, #FFB347 0%, #FF8C69 100%)',
            }}
          >
            <p className="text-white font-bold text-xl leading-relaxed">
              你什么都不用做，
              <br />
              心系自动送达。
            </p>
          </div>
        </section>

        {/* ===== 第四屏：它怎么帮你表达关心 ===== */}
        <section className="py-20 px-6 bg-[#FFF8F3]">
          <h2 className="text-2xl font-bold text-[#4A3F3A] text-center mb-10">
            它怎么帮你表达关心
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-3xl mb-3">🎙️</div>
              <h3 className="font-bold text-[#4A3F3A] mb-2 text-base">
                用你的声音说关心
              </h3>
              <p className="text-sm text-[#8B7D75] leading-relaxed">
                提前录几句叮嘱，AI每天用你的声音说给家人听
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-bold text-[#4A3F3A] mb-2 text-base">
                自动了解彼此
              </h3>
              <p className="text-sm text-[#8B7D75] leading-relaxed">
                步数、睡眠、出门情况，让你知道家人今天过得好不好
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-bold text-[#4A3F3A] mb-2 text-base">
                绝对隐私
              </h3>
              <p className="text-sm text-[#8B7D75] leading-relaxed">
                不录音、不看聊天内容，所有数据你说了算
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="text-3xl mb-3">💌</div>
              <h3 className="font-bold text-[#4A3F3A] mb-2 text-base">
                定时送达
              </h3>
              <p className="text-sm text-[#8B7D75] leading-relaxed">
                每天固定时间，收到家人的声音，像一封温暖的信
              </p>
            </div>
          </div>
        </section>

        {/* ===== 第五屏：3步上手 ===== */}
        <section className="py-20 px-6 bg-white">
          <h2 className="text-2xl font-bold text-[#4A3F3A] text-center mb-12">
            3步上手
          </h2>

          <div className="relative pl-4">
            {/* 虚线连接线 */}
            <div
              className="absolute left-6 top-10 bottom-10 w-px border-l-2 border-dashed border-[#FF8C69]/30"
            />

            <div className="relative flex gap-5 mb-14">
              <div className="w-14 text-5xl font-bold text-[#FF8C69] flex-shrink-0 leading-none">
                1
              </div>
              <div className="pt-2">
                <p className="text-[#4A3F3A] font-medium text-base leading-relaxed">
                  下载「心系」，填个昵称
                </p>
              </div>
            </div>

            <div className="relative flex gap-5 mb-14">
              <div className="w-14 text-5xl font-bold text-[#FF8C69] flex-shrink-0 leading-none">
                2
              </div>
              <div className="pt-2">
                <p className="text-[#4A3F3A] font-medium text-base leading-relaxed">
                  生成邀请码，发给爸妈，配对成功
                </p>
              </div>
            </div>

            <div className="relative flex gap-5">
              <div className="w-14 text-5xl font-bold text-[#FF8C69] flex-shrink-0 leading-none">
                3
              </div>
              <div className="pt-2">
                <p className="text-[#4A3F3A] font-medium text-base leading-relaxed">
                  录几句你想说的话，剩下的交给AI
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-[#FF8C69] font-semibold mt-12 text-lg">
            每天30秒，让爸妈听到你的关心。
          </p>
        </section>

        {/* ===== 第六屏：谁在用「心系」 ===== */}
        <section className="py-20 px-6 bg-[#FFF8F3]">
          <h2 className="text-2xl font-bold text-[#4A3F3A] text-center mb-10">
            谁在用「心系」
          </h2>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#FF8C69]">
              <p className="text-[#4A3F3A] text-base leading-relaxed mb-3">
                "终于不用纠结要不要打电话了"
              </p>
              <p className="text-sm text-[#8B7D75]">—— 异地工作的子女</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#FF8C69]">
              <p className="text-[#4A3F3A] text-base leading-relaxed mb-3">
                "每天能听到孩子的声音，就踏实了"
              </p>
              <p className="text-sm text-[#8B7D75]">—— 留守在家的父母</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-[#FF8C69]">
              <p className="text-[#4A3F3A] text-base leading-relaxed mb-3">
                "爱你在心口难开，现在开了"
              </p>
              <p className="text-sm text-[#8B7D75]">—— 不善于表达的家庭</p>
            </div>
          </div>
        </section>

        {/* ===== 第七屏：结尾 ===== */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-center px-8 text-center overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 70%, #FFB347 0%, #FF8C69 70%, #FF7A5C 100%)',
          }}
        >
          {/* 声音波纹装饰 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-56 h-56 rounded-full border border-white/15 animate-ping" style={{ animationDuration: '3.5s' }} />
            <div className="absolute w-80 h-80 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.6s' }} />
            <div className="absolute w-[28rem] h-[28rem] rounded-full border border-white/5 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '1.2s' }} />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-10 leading-snug">
              有些话，你不好意思说，
              <br />
              让「心系」替你说。
            </h2>
            <p className="text-xl text-white/90 mb-20">
              现在就给爸妈发第一声关心。
            </p>

            <div className="mt-16">
              <p className="text-5xl font-bold text-white mb-3 tracking-wider">
                心系
              </p>
              <p className="text-lg text-white/80 font-light">
                让爱，不用开口
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
