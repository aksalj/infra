import { useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSpring, animated, config } from '@react-spring/web'
import {
  StarIcon,
  IdentificationIcon,
  ArrowPathIcon,
  CommandLineIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

import Layout from '../components/layout'

function Card() {
  const trans = (x, y, s) =>
    `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`
  const filter = (x, y) => `hue-rotate(${(x + y * 2) * 12}deg)`
  const cardRef = useRef(null)
  const calc = (x, y, rect) => [
    -(y - rect.top - rect.height / 2) / 16,
    (x - rect.left - rect.width / 2) / 32,
    1.03,
  ]
  const [xys, set] = useState([0, 0, 1])
  const props = useSpring({
    xys,
    rotation: (xys[0] + xys[1]) * 5,
    config: config.stiff,
    easing: t => ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2,
  })

  return (
    <animated.div
      ref={cardRef}
      className={`drag-none group relative right-12 hidden h-[260px] w-[480px] flex-none select-none flex-col items-start justify-between rounded-3xl bg-[url('/images/bg.png')] bg-clip-text shadow-[0_30px_85px_0px_rgba(0,0,0,0.07)] transition-shadow duration-200 hover:shadow-[0_30px_100px_0px_rgba(0,0,0,0.1)] lg:flex xl:h-[280px] xl:w-[512px]`}
      onMouseLeave={() => set([0, 0, 1])}
      onMouseMove={e => {
        const rect = cardRef.current.getBoundingClientRect()
        set(calc(e.clientX, e.clientY, rect))
      }}
      style={{
        transform: props.xys.to(trans),
        filter: props.xys.to(filter),
      }}
    >
      <div className='mx-5 my-5 flex items-center justify-end self-stretch'>
        <svg
          className={`h-7 self-start fill-current text-black transition-colors duration-150`}
          viewBox='0 0 178 42'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M171.106 24.54C171.056 24.54 171.007 24.54 171.007 24.4906C171.007 24.4411 170.907 24.4411 170.808 24.4411C170.609 24.3917 170.41 24.3917 170.212 24.3917C170.112 24.3917 170.013 24.3917 169.914 24.3422H169.864C169.318 24.2928 168.722 24.1939 168.175 24.0456C168.026 23.9961 167.877 23.8478 167.827 23.6995C167.877 23.6995 167.827 23.6995 167.827 23.6995L167.43 23.6006C167.629 22.1667 167.529 20.6833 167.231 19.2495C166.884 17.8156 166.288 16.4311 165.493 15.195L165.791 14.8984V14.8489C165.791 14.7006 165.841 14.5028 165.94 14.4039C166.387 14.0084 166.834 13.7117 167.331 13.415C167.43 13.3656 167.529 13.3161 167.629 13.2667C167.827 13.1678 167.976 13.0689 168.175 12.97C168.225 12.9206 168.274 12.9206 168.324 12.8711C168.374 12.8217 168.324 12.8217 168.324 12.7722C168.771 12.4261 168.871 11.8328 168.523 11.3878C168.374 11.19 168.076 11.0417 167.827 11.0417C167.579 11.0417 167.331 11.1406 167.132 11.2889L167.082 11.3384C167.033 11.3878 166.983 11.4372 166.933 11.4372C166.784 11.5856 166.635 11.7339 166.536 11.8822C166.486 11.9811 166.387 12.0306 166.337 12.08C165.99 12.4756 165.542 12.8711 165.095 13.1678C164.996 13.2172 164.897 13.2667 164.797 13.2667C164.748 13.2667 164.648 13.2667 164.599 13.2172H164.549L164.152 13.4645C163.754 13.0689 163.307 12.6734 162.91 12.2778C161.072 10.8439 158.787 9.95391 156.452 9.70669L156.403 9.31114V9.36058C156.254 9.26169 156.204 9.11336 156.154 8.96503C156.154 8.42114 156.154 7.87725 156.254 7.28392V7.23447C156.254 7.13558 156.303 7.03669 156.303 6.93781C156.353 6.74003 156.353 6.54225 156.403 6.34447V6.04781C156.452 5.55336 156.055 5.05892 155.558 5.00947C155.26 4.96003 154.962 5.10836 154.714 5.35558C154.515 5.55336 154.416 5.80058 154.416 6.04781V6.29503C154.416 6.49281 154.465 6.69058 154.515 6.88836C154.565 6.98725 154.565 7.08614 154.565 7.18503V7.23447C154.664 7.77836 154.664 8.32225 154.664 8.91558C154.614 9.06391 154.565 9.21225 154.416 9.31114V9.41003L154.366 9.80558C153.82 9.85502 153.273 9.95391 152.677 10.0528C150.342 10.5472 148.206 11.7834 146.567 13.5139L146.269 13.3161H146.22C146.17 13.3161 146.12 13.3656 146.021 13.3656C145.922 13.3656 145.822 13.3161 145.723 13.2667C145.276 12.9206 144.829 12.525 144.481 12.1295C144.431 12.0306 144.332 11.9811 144.282 11.9317C144.133 11.7834 144.034 11.635 143.885 11.4867C143.835 11.4372 143.786 11.4372 143.736 11.3878C143.686 11.3384 143.686 11.3384 143.686 11.3384C143.488 11.19 143.239 11.0911 142.991 11.0911C142.693 11.0911 142.444 11.19 142.295 11.4372C141.997 11.8822 142.097 12.4756 142.494 12.8217C142.544 12.8217 142.544 12.8711 142.544 12.8711C142.544 12.8711 142.643 12.97 142.693 12.97C142.842 13.0689 143.04 13.1678 143.239 13.2667C143.338 13.3161 143.438 13.3656 143.537 13.415C144.034 13.7117 144.531 14.0084 144.928 14.4039C145.027 14.5028 145.127 14.7006 145.077 14.8489V14.7995L145.375 15.0961C145.325 15.195 145.276 15.2445 145.226 15.3434C143.686 17.7661 143.04 20.6339 143.488 23.4522L143.09 23.5511C143.09 23.6006 143.04 23.6006 143.04 23.6006C142.991 23.7489 142.842 23.8478 142.693 23.9467C142.146 24.095 141.6 24.1939 141.004 24.2433C140.905 24.2433 140.805 24.2433 140.706 24.2928C140.507 24.2928 140.308 24.3422 140.11 24.3422C140.06 24.3422 140.01 24.3917 139.911 24.3917C139.861 24.3917 139.861 24.3917 139.812 24.4411C139.265 24.54 138.918 25.0345 139.017 25.5783C139.116 26.0233 139.563 26.32 140.01 26.2706C140.11 26.2706 140.159 26.2706 140.259 26.2211C140.308 26.2211 140.308 26.2211 140.308 26.1717C140.308 26.1222 140.457 26.1717 140.507 26.1717C140.706 26.1222 140.905 26.0233 141.054 25.9739C141.153 25.9245 141.252 25.875 141.352 25.875H141.401C141.948 25.6772 142.444 25.5289 143.04 25.43H143.09C143.239 25.43 143.388 25.4795 143.488 25.5783C143.537 25.5783 143.537 25.6278 143.537 25.6278L143.984 25.5783C144.729 27.8528 146.12 29.88 148.057 31.3633C148.505 31.7094 148.902 32.0061 149.399 32.2533L149.15 32.5994C149.15 32.6489 149.2 32.6489 149.2 32.6489C149.299 32.7972 149.299 32.995 149.25 33.1433C149.051 33.6378 148.753 34.1322 148.455 34.5772V34.6267C148.405 34.7256 148.355 34.775 148.256 34.8739C148.157 34.9728 148.057 35.1706 147.908 35.3683C147.859 35.4178 147.859 35.4672 147.809 35.5167C147.809 35.5167 147.809 35.5661 147.759 35.5661C147.511 36.0606 147.71 36.6539 148.157 36.9011C148.256 36.9506 148.405 37 148.505 37C148.902 37 149.25 36.7528 149.448 36.4067C149.448 36.4067 149.448 36.3572 149.498 36.3572C149.498 36.3078 149.548 36.2583 149.597 36.2089C149.647 36.0111 149.746 35.8628 149.796 35.665L149.895 35.3683C150.044 34.8244 150.293 34.33 150.541 33.8356C150.64 33.6872 150.789 33.5883 150.939 33.5389C150.988 33.5389 150.988 33.5389 150.988 33.4894L151.187 33.0939C152.578 33.6378 154.018 33.885 155.508 33.885C156.403 33.885 157.297 33.7861 158.191 33.5389C158.737 33.44 159.284 33.2422 159.78 33.0939L159.979 33.44C160.029 33.44 160.029 33.44 160.029 33.4894C160.178 33.5389 160.327 33.6378 160.426 33.7861C160.674 34.2806 160.923 34.775 161.072 35.3189V35.3683L161.171 35.665C161.221 35.8628 161.271 36.0606 161.37 36.2089C161.42 36.2583 161.42 36.3078 161.469 36.3572C161.469 36.3572 161.469 36.4067 161.519 36.4067C161.718 36.7528 162.065 37 162.463 37C162.612 37 162.711 36.9506 162.86 36.9011C163.059 36.8022 163.257 36.6044 163.307 36.3572C163.357 36.11 163.357 35.8628 163.257 35.6156C163.257 35.5661 163.208 35.5661 163.208 35.5661C163.208 35.5167 163.158 35.4672 163.108 35.4178C163.009 35.22 162.91 35.0717 162.761 34.9233C162.711 34.8244 162.661 34.775 162.562 34.6761V34.5772C162.214 34.1322 161.966 33.6378 161.767 33.1433C161.718 32.995 161.718 32.7972 161.817 32.6489C161.817 32.5994 161.867 32.5994 161.867 32.5994L161.718 32.2039C164.251 30.6711 166.188 28.2978 167.082 25.4795L167.48 25.5289C167.529 25.5289 167.529 25.4795 167.529 25.4795C167.629 25.3806 167.778 25.3311 167.927 25.3311H167.976C168.523 25.43 169.069 25.5783 169.566 25.7761H169.616C169.715 25.8256 169.814 25.875 169.914 25.875C170.112 25.9739 170.261 26.0728 170.46 26.1222C170.51 26.1222 170.559 26.1717 170.659 26.1717C170.708 26.1717 170.708 26.1717 170.758 26.2211C170.858 26.2706 170.907 26.2706 171.007 26.2706C171.454 26.2706 171.851 25.9739 172 25.5783C171.95 25.0345 171.553 24.6389 171.106 24.54V24.54ZM156.75 23.0072L155.409 23.65L154.068 23.0072L153.72 21.5733L154.664 20.3867H156.154L157.098 21.5733L156.75 23.0072V23.0072ZM164.847 19.7933C165.095 20.8317 165.145 21.87 165.046 22.9083L160.327 21.5733C159.88 21.4745 159.631 21.0295 159.731 20.5845C159.78 20.4361 159.83 20.3372 159.929 20.2383L163.655 16.8761C164.201 17.7661 164.599 18.755 164.847 19.7933V19.7933ZM162.165 15.0467L158.091 17.9145C157.744 18.1122 157.247 18.0628 156.999 17.7167C156.899 17.6178 156.85 17.5189 156.85 17.3706L156.552 12.3767C158.737 12.6239 160.674 13.5634 162.165 15.0467V15.0467ZM153.174 12.525L154.167 12.3272L153.919 17.2717C153.919 17.7167 153.522 18.0628 153.074 18.0628C152.925 18.0628 152.826 18.0134 152.677 17.9639L148.554 15.0467C149.846 13.8106 151.435 12.9206 153.174 12.525ZM147.114 16.8761L150.789 20.1395C151.137 20.4361 151.187 20.9306 150.889 21.2767C150.789 21.425 150.69 21.4745 150.491 21.5239L145.673 22.9083C145.524 20.8317 146.021 18.7056 147.114 16.8761V16.8761ZM146.269 25.2322L151.187 24.3917C151.584 24.3917 151.982 24.6389 152.031 25.0345C152.081 25.1828 152.081 25.3806 151.982 25.5289L150.094 30.0778C148.355 28.9406 146.965 27.21 146.269 25.2322V25.2322ZM157.545 31.3633C156.85 31.5117 156.154 31.6106 155.409 31.6106C154.366 31.6106 153.273 31.4128 152.28 31.1161L154.714 26.7156C154.962 26.4189 155.359 26.32 155.707 26.5178C155.856 26.6167 155.956 26.7156 156.105 26.8639L158.489 31.1656C158.191 31.215 157.893 31.2644 157.545 31.3633V31.3633ZM163.605 27.0617C162.86 28.2483 161.817 29.2867 160.625 30.0283L158.688 25.3806C158.588 24.985 158.787 24.5895 159.135 24.4411C159.284 24.3917 159.433 24.3422 159.582 24.3422L164.549 25.1828C164.301 25.875 164.003 26.5178 163.605 27.0617Z'
            fill='current'
          />
          <path
            d='M12.9162 16.6475C9.09375 16.6475 6 19.7412 6 23.5637C6 27.3862 9.09375 30.48 12.9162 30.48C16.7387 30.48 19.8325 27.3862 19.8325 23.5637C19.8325 19.7412 16.7387 16.6475 12.9162 16.6475ZM12.9162 27.0287C11.005 27.0287 9.45125 25.475 9.45125 23.5637C9.45125 21.6525 11.005 20.0987 12.9162 20.0987C14.8275 20.0987 16.3812 21.6525 16.3812 23.5637C16.3812 25.475 14.8275 27.0287 12.9162 27.0287Z'
            fill='current'
          />
          <path
            d='M25.0712 25.8875C25.0712 25.3375 25.7312 25.0763 26.1162 25.4613C27.8487 27.2213 30.7087 30.2463 30.7225 30.26C30.7637 30.3013 30.805 30.37 30.97 30.425C31.0387 30.4525 31.1487 30.4525 31.2725 30.4525H34.3937C34.9575 30.4525 35.1225 29.8063 34.8612 29.4763L29.6912 24.1825L29.4162 23.9075C28.825 23.2063 28.8937 22.9313 29.5675 22.2163L33.665 17.6375C33.9262 17.3075 33.7612 16.675 33.1837 16.675H30.3512C30.2412 16.675 30.1587 16.675 30.0762 16.7025C29.9112 16.7575 29.8425 16.8125 29.8012 16.8675C29.7875 16.8813 27.5187 19.3287 26.1162 20.8275C25.7312 21.24 25.0437 20.965 25.0437 20.4012V12.55C25.0437 12.1512 24.7137 12 24.4525 12H22.1425C21.7437 12 21.5512 12.2612 21.5512 12.495V29.9025C21.5512 30.3012 21.8812 30.4112 22.1562 30.4112H24.4662C24.8237 30.4112 25.0575 30.15 25.0575 29.8888V29.71V25.8875H25.0712Z'
            fill='current'
          />
          <path
            d='M43.9362 29.82L43.6887 27.51C43.6612 27.1937 43.3587 26.9737 43.0425 27.0287C42.8637 27.0562 42.685 27.07 42.5062 27.07C40.6637 27.07 39.165 25.6262 39.055 23.7975C39.055 23.7425 39.055 23.6737 39.055 23.605V20.7725C39.055 20.4012 39.33 20.0987 39.7012 20.0987H42.795C43.015 20.0987 43.345 19.9062 43.345 19.5075V17.3212C43.345 16.895 43.07 16.675 42.8225 16.675H39.7012C39.3437 16.675 39.055 16.4137 39.0412 16.0562V12.55C39.0412 12.33 38.8762 12 38.45 12H36.1537C35.865 12 35.59 12.1788 35.59 12.5362C35.59 12.5362 35.59 23.7425 35.59 23.7975C35.6862 27.5375 38.7525 30.5212 42.5062 30.5212C42.8225 30.5212 43.125 30.4937 43.4275 30.4525C43.7575 30.4112 43.9775 30.1362 43.9362 29.82Z'
            fill='current'
          />
          <path
            d='M60.6012 26.9188C58.6487 26.9188 58.3463 26.2175 58.3463 23.5913C58.3463 23.5775 58.3463 23.5775 58.3463 23.5638V17.2525C58.3463 17.0325 58.1812 16.6613 57.7412 16.6613H55.4312C55.1425 16.6613 54.8262 16.895 54.8262 17.2525V17.5413C53.8225 16.9638 52.6537 16.6338 51.4162 16.6338C47.5937 16.6338 44.5 19.7275 44.5 23.55C44.5 27.3725 47.5937 30.4663 51.4162 30.4663C53.135 30.4663 54.7025 29.8338 55.9125 28.8025C56.5587 29.7925 57.6038 30.4525 59.24 30.4663C59.515 30.4663 61 30.5213 61 29.82V27.3588C61 27.1525 60.835 26.9188 60.6012 26.9188ZM51.43 27.0288C49.5187 27.0288 47.965 25.475 47.965 23.5638C47.965 21.6525 49.5187 20.0988 51.43 20.0988C53.3412 20.0988 54.895 21.6525 54.895 23.5638C54.8812 25.475 53.3275 27.0288 51.43 27.0288Z'
            fill='current'
          />
          <path
            d='M115.707 23.7071C116.098 23.3166 116.098 22.6834 115.707 22.2929L109.343 15.9289C108.953 15.5384 108.319 15.5384 107.929 15.9289C107.538 16.3195 107.538 16.9526 107.929 17.3431L113.586 23L107.929 28.6569C107.538 29.0474 107.538 29.6805 107.929 30.0711C108.319 30.4616 108.953 30.4616 109.343 30.0711L115.707 23.7071ZM75 24H115V22H75V24Z'
            fill='current'
          />
        </svg>
      </div>
      <div className='mt-2 grid w-full auto-rows-min grid-cols-8 items-baseline gap-y-1 px-10 pb-6 pr-16 font-mono font-medium text-gray-500 transition-colors group-hover:text-transparent'>
        <div className='col-span-2 text-xs uppercase tracking-wide'>user</div>
        <div className='col-span-6 text-xs tracking-wide'>user@acme.com</div>
        <div className='col-span-2 text-xs uppercase tracking-wide'>groups</div>
        <div className='col-span-6 text-xs tracking-wide'>
          Engineering, DevOps, Security
        </div>
        <div className='col-span-2 text-xs uppercase tracking-wide'>ROLE</div>
        <div className='col-span-6 text-xs tracking-wide'>cluster-admin</div>
        <div className='col-span-2 text-xs tracking-wide'>TOKEN</div>
        <div className='col-span-6 break-all text-[11px] leading-tight'>
          eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNreWxhckBpbmZyYWhxLmNvbSJ9.HmbsgcIENeWo4WjCQ38s5IZ5_PwZC2qhU_iopPR98J8
        </div>
      </div>
    </animated.div>
  )
}

export default function Index() {
  return (
    <>
      <Head>
        <title>Infra - Infrastructure Access</title>
        <meta property='og:title' content='Infrastructure Access' key='title' />
        <meta
          property='og:description'
          content='Connect your team to your infrastructure'
        />
      </Head>
      <section className='flex flex-1 flex-col px-6'>
        <div className='relative mx-auto my-24 flex w-full max-w-7xl flex-1 items-center justify-between space-x-16'>
          <div className='flex max-w-2xl flex-1 flex-col'>
            <h1 className='my-4 overflow-visible text-3xl font-bold tracking-tight md:text-6xl'>
              Connect your team to your infrastructure.
            </h1>
            <h2 className='text-md max-w-xl text-gray-600 md:text-2xl'>
              Infra is the easiest way to manage access to Kubernetes, with more
              integrations coming soon.
            </h2>
            <div className='z-40 my-6 flex items-center space-x-2 text-base'>
              <Link href='/docs/getting-started/quickstart'>
                <a className='group relative rounded-full bg-blue-500 py-1.5 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:py-2 md:px-5 md:text-lg'>
                  Get Started{' '}
                  <span className='inline-block transition-transform group-hover:translate-x-0.5'>
                    ›
                  </span>
                </a>
              </Link>
              <Link href='https://github.com/infrahq/infra'>
                <a className='flex items-center rounded-full border border-gray-300 py-1.5 px-3 text-base font-semibold text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:py-2 md:px-4 md:text-lg'>
                  <StarIcon className='relative mr-1.5 h-5 stroke-current' />{' '}
                  Star on GitHub
                </a>
              </Link>
            </div>
          </div>
          <Card />
        </div>
      </section>
      <section className='mb-12 flex flex-1 flex-col px-6'>
        <div className='mx-auto grid w-full max-w-7xl grid-cols-2 gap-12 md:grid-cols-4'>
          <div>
            <CommandLineIcon className='h-7 stroke-1 text-gray-700' />
            <h3 className='my-1.5 text-sm font-medium'>
              Access that just works
            </h3>
            <p className='text-sm text-gray-500'>
              Discover and access to infrastructure hosted anywhere, in a single
              place.
            </p>
          </div>
          <div>
            <ArrowPathIcon className='h-7 stroke-1 text-gray-700' />
            <h3 className='my-1.5 text-sm font-medium'>
              Keep credentials up to date
            </h3>
            <p className='text-sm text-gray-500'>
              No more out-of-date configurations. Infra automatically refreshes
              credentials.
            </p>
          </div>
          <div>
            <IdentificationIcon className='h-7 stroke-1 text-gray-700' />
            <h3 className='my-1.5 text-sm font-medium'>
              Import users &amp; groups
            </h3>
            <p className='text-sm text-gray-500'>
              On-board and off-board users via identity providers such as Google
              and Google.
            </p>
          </div>
          <div>
            <ShieldCheckIcon className='h-7 stroke-1 text-gray-700' />
            <h3 className='my-1.5 text-sm font-medium'>
              Secure &amp; easy to use
            </h3>
            <p className='text-sm text-gray-500'>
              Provide short-lived and fine-grained access to specific
              infrastructure resources.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

Index.layout = page => <Layout>{page}</Layout>
