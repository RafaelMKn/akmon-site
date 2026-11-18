import { ArquiteturaRepositorio } from './components/ArquiteturaRepositorio'
import { Demonstracao } from './components/demo/Demonstracao'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'

export default function App() {
  return (
    <div className="relative mx-auto max-w-[1280px] border-x border-aco bg-papel">
      <Header />
      <main>
        <Hero>
          <Demonstracao />
        </Hero>
        <ArquiteturaRepositorio />
      </main>
      <Footer />
    </div>
  )
}
