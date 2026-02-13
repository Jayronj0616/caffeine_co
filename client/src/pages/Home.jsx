import { Link } from 'react-router-dom';

const Home = () => {
    // High-quality latent space coffee background
    const heroImage = "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=2560&auto=format&fit=crop"; 
    const latteArt = "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="animate-fade-in-up">
      {/* Hero Section with Parallax Background */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-8 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
             <img src={heroImage} alt="Coffee Background" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-parchment/90 backdrop-blur-[2px]"></div> {/* Overlay to keep text readable */}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto pt-20">
            <h1 className="text-6xl md:text-8xl mb-6 font-serif font-bold text-espresso leading-tight drop-shadow-sm">The Art of the Slow Pour.</h1>
            <p className="text-xl text-bean max-w-2xl mx-auto mb-12 italic font-medium">
            Hand-crafted espresso and rare single-origin beans, served in an atmosphere of curated calm.
            </p>
            <Link to="/menu">
                <button className="bg-espresso text-parchment px-10 py-4 rounded-sm text-sm font-bold uppercase tracking-[0.2em] hover:bg-bean transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Reserve Your Experience
                </button>
            </Link>
        </div>
      </section>

      {/* Visual Break / Image Section */}
      <section className="py-24 px-8 bg-parchment">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
              <div className="md:w-1/2 relative group">
                  <div className="absolute -inset-4 border border-oatmeal rounded-full opacity-50 group-hover:rotate-12 transition-transform duration-700"></div>
                  <img 
                    src={latteArt} 
                    alt="Latte Art" 
                    className="w-full h-[500px] object-cover rounded-t-[10rem] rounded-b-lg shadow-2xl grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                  />
              </div>
              <div className="md:w-1/2 text-left space-y-8">
                  <h2 className="text-5xl font-serif text-espresso leading-tight">Precision in <br/><span className="italic text-bean">Every Cup</span>.</h2>
                  <p className="text-bean text-lg leading-relaxed border-l-2 border-oatmeal pl-6">
                      We believe that coffee is more than just caffeine—it's a ritual. Our baristas are trained artisans, dedicated to the perfect extraction and the most velvety milk texture.
                  </p>
                  <Link to="/origins" className="inline-block text-espresso font-bold uppercase tracking-widest border-b border-espresso pb-1 hover:text-bean hover:border-bean transition-all">
                      Discover Our Origins
                  </Link>
              </div>
          </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-oatmeal/20 py-24 px-8 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-oatmeal/30 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
          {[
            { id: "01", title: "Ethically Sourced", desc: "We work directly with growers in Ethiopia and Colombia to ensure quality and fairness." },
            { id: "02", title: "Artisan Roast", desc: "Small-batch roasting ensures the unique profile of every bean is preserved." },
            { id: "03", title: "Master Brewers", desc: "Our baristas are trained in the precise alchemy of water, temperature, and time." }
          ].map((feature, idx) => (
            <div key={idx} className="bg-milk border border-oatmeal/50 rounded-lg p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-full bg-oatmeal/30 flex items-center justify-center mb-6 group-hover:bg-bean group-hover:text-parchment transition-all duration-500">
                 <span className="font-serif italic font-bold text-espresso group-hover:text-parchment">{feature.id}</span>
              </div>
              <h3 className="text-2xl mb-4 font-serif font-bold text-espresso">{feature.title}</h3>
              <p className="text-sm text-bean leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
export default Home;
