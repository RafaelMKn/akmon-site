import { Categorias } from './components/Categorias'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Instalar } from './components/Instalar'

export default function App() {
  return (
    <div className="relative mx-auto max-w-[1280px] border-x border-aco bg-papel">
      <Header />
      <main>
        <Hero />
        <Categorias />
        <Instalar />
      </main>
      <Footer />
    </div>
  )
}
