const Footer = () => {
    return (
      <footer className="py-20 px-8 border-t border-oatmeal bg-parchment">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-3xl mb-2 font-serif font-bold text-espresso">Caffeine Co.</h2>
            <p className="text-bean text-sm">123 Artisan Alley, Roastery District</p>
          </div>
          <div className="flex gap-8">
            {['Instagram', 'Twitter', 'Press'].map((link) => (
              <a key={link} href="#" className="font-semibold text-sm text-espresso hover:underline hover:text-bean transition-colors tracking-wide uppercase">
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs uppercase tracking-widest text-bean opacity-70">© 2026 Caffeine Co. Est 2024.</p>
        </div>
      </footer>
    );
};
export default Footer;
